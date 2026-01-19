import * as React from 'react';
import { useTheme } from "@/contexts/ThemeContext";

import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import ExportButtons from '@/components/reports/ExportButtons';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import { useTransactionData } from '@/hooks/transactions/useTransactionData';
import { useTransactions } from '@/contexts/TransactionsContext';
import { showSuccess, showError } from '@/utils/toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/contexts/UserContext';
import { Budget } from '@/types/dataProvider';
import { cn, slugify } from '@/lib/utils';
import { useDataProvider } from '@/context/DataProviderContext';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

interface ReportLayoutProps {
  title: string;
  description: React.ReactNode;
  children: (props: {
    historicalFilteredTransactions: any[];
    combinedFilteredTransactions: any[];
    futureFilteredTransactions: any[];
    accounts: any[];
    budgets: Budget[];
  }) => React.ReactNode;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({ title, description, children }) => {
  const { accounts, vendors, categories, subCategories } = useTransactions();
  const { user } = useUser();

  const availableAccountOptions = React.useMemo(() =>
    accounts.map((acc: any) => ({ value: slugify(acc.name), label: acc.name })),
    [accounts]
  );

  const availableVendorOptions = React.useMemo(() =>
    vendors.map((v: any) => ({ value: slugify(v.name), label: v.name })),
    [vendors]
  );

  const availableCategoryOptions = React.useMemo(() =>
    categories.map((c: any) => ({ value: slugify(c.name), label: c.name })),
    [categories]
  );

  const categoryTreeData = React.useMemo(() =>
    categories.map((c: any) => {
      const subs = subCategories.filter((s: any) => s.category_id === c.id);
      return {
        id: c.id,
        name: c.name,
        slug: slugify(c.name),
        subCategories: subs.map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: slugify(s.name)
        }))
      };
    }),
    [categories, subCategories]
  );

  const filterProps = useTransactionFilters();
  const dataProps = useTransactionData({
    ...filterProps,
    excludeTransfers: filterProps.excludeTransfers,
    availableAccountOptions,
    availableCategoryOptions,
    availableVendorOptions,
  });
  const { isFinancialPulse } = useTheme();
  const dataProvider = useDataProvider();

  const { data: budgets = [] } = useQuery<Budget[], Error>({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Use data provider to fetch budgets. DataProvider returns budgets with category_name usually.
      // But getBudgetsWithSpending might be overkill if we just want basic list?
      // Actually, ReportLayout just wants the list to calculate things maybe.
      // Let's use getBudgetsWithSpending as it is the main getter we implemented.
      const budgets = await dataProvider.getBudgetsWithSpending(user.id);
      return budgets;
    },
    enabled: !!user,
  });

  const { historicalFilteredTransactions, futureFilteredTransactions } = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const historical = dataProps.filteredTransactions.filter(t => new Date(t.date) <= today);
    const future = dataProps.filteredTransactions.filter(t => new Date(t.date) > today && t.is_scheduled_origin);
    return { historicalFilteredTransactions: historical, futureFilteredTransactions: future };
  }, [dataProps.filteredTransactions]);

  const handlePdfExport = async () => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // --- Helper: Check Page Break ---
      const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - 10) {
          doc.addPage();
          yPos = 20;
          return true;
        }
        return false;
      };

      // --- 1. Header & Title ---
      doc.setFontSize(18);
      doc.text(title, 14, yPos);
      yPos += 10;

      // --- 2. Filter Summary ---
      doc.setFontSize(10);
      doc.setTextColor(100);

      const dateText = filterProps.dateRange?.from && filterProps.dateRange?.to
        ? `${format(filterProps.dateRange.from, 'MMM d, yyyy')} - ${format(filterProps.dateRange.to, 'MMM d, yyyy')}`
        : "All Dates";

      const accountText = filterProps.selectedAccounts.length > 0
        ? `Accounts: ${filterProps.selectedAccounts.map(slug => accounts.find((a: any) => slugify(a.name) === slug)?.name || slug).join(', ')}`
        : "All Accounts";

      // Wrap text for accounts if too long
      const splitAccountText = doc.splitTextToSize(accountText, pageWidth - 28);

      doc.text(`Date Range: ${dateText}`, 14, yPos);
      yPos += 5;
      doc.text(splitAccountText, 14, yPos);
      yPos += (splitAccountText.length * 5) + 5;

      doc.setDrawColor(200);
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 10;
      doc.setTextColor(0);

      // --- 3. Content Processing ---
      const reportContent = document.getElementById('report-content');
      if (!reportContent) {
        showError("Could not find report content to export.");
        return;
      }

      // We treat direct children of report-content as "Report Sections" (e.g., Cards)
      const sections = Array.from(reportContent.children) as HTMLElement[];

      if (sections.length === 0) {
        showError("No content found to export.");
        return;
      }

      showSuccess("Generating PDF... This may take a moment.");

      for (const section of sections) {
        // Determine strategy: Table (Data) vs Visual (Canvas/Charts/Summary)
        // Heuristic: If it has charts (recharts) OR no tables, capture as image.
        // If it has tables and no charts, use autoTable.

        const hasCharts = section.querySelector('.recharts-wrapper') || section.querySelector('canvas');
        const tables = Array.from(section.querySelectorAll('table'));
        const hasTables = tables.length > 0;

        // If it's a visual section (charts) or a summary card without tables
        if (hasCharts || !hasTables) {
          // Capture as Image
          // Temporarily hide scrollbars or overflow if needed, usually html2canvas handles visible parts.
          // We might need to ensure background color is white.

          try {
            const canvas = await html2canvas(section, {
              scale: 2, // Retrolution
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff' // Ensure white background for dark mode compatibility if needed, or transparent
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 28; // 14mm margin each side
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            checkPageBreak(imgHeight);

            doc.addImage(imgData, 'PNG', 14, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 10;
          } catch (e) {
            console.error("Image capture failed for section", e);
            doc.setFontSize(10);
            doc.setTextColor(255, 0, 0);
            doc.text("[Visual Content Not Captured]", 14, yPos);
            yPos += 10;
            doc.setTextColor(0);
          }

        } else if (hasTables) {
          // Render Title if found (e.g. Card Title)
          const titleEl = section.querySelector('h3') || section.querySelector('.card-title') || section.querySelector('div[class*="font-semibold"]'); // approximate selector
          if (titleEl) {
            const titleText = titleEl.textContent?.trim() || "";
            if (titleText) {
              checkPageBreak(15);
              doc.setFontSize(12);
              doc.setFont("helvetica", "bold");
              doc.text(titleText, 14, yPos);
              yPos += 8;
              doc.setFont("helvetica", "normal");
            }
          }

          // Use AutoTable for each table in this section
          for (const table of tables) {
            // Check if table has a specific predecessor title (like "Income" vs "Expenses")
            // heuristic: find closest previous sibling header inside the section? 
            // For now, simple autoTable is huge improvement over nothing.

            autoTable(doc, {
              html: table,
              startY: yPos,
              theme: 'grid',
              headStyles: { fillColor: '#16a34a' },
              margin: { left: 14, right: 14 },
              styles: { fontSize: 9 },
              didDrawPage: (data) => {
                // Resets yPos after new page
                if (data.cursor) {
                  yPos = data.cursor.y;
                }
              }
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
          }
        }
      }

      doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
      showSuccess("PDF export completed successfully.");
    } catch (error: any) {
      console.error("PDF Export failed:", error);
      showError(`PDF Export failed: ${error.message}`);
    }
  };

  const handleExcelExport = () => showSuccess("Excel export is not yet implemented.");
  const handleCsvExport = () => showSuccess("CSV export is not yet implemented.");

  return (
    <div className={cn(
      "space-y-6 transition-colors duration-500",
      isFinancialPulse ? "bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6 rounded-xl -m-6 min-h-[calc(100vh-100px)] text-white" : ""
    )}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={cn("text-3xl font-bold tracking-tight", isFinancialPulse ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400" : "")}>{title}</h2>
          <div className={cn("text-muted-foreground", isFinancialPulse ? "text-slate-400" : "")}>{description}</div>
        </div>
        <ExportButtons
          onPdfExport={handlePdfExport}
          onExcelExport={handleExcelExport}
          onCsvExport={handleCsvExport}
        />
      </div>

      <TransactionFilters
        {...filterProps}
        availableAccountOptions={availableAccountOptions}
        availableVendorOptions={availableVendorOptions}
        categoryTreeData={categoryTreeData}
        onDateChange={filterProps.setDateRange}
        onExcludeTransfersChange={filterProps.setExcludeTransfers}
        onResetFilters={filterProps.handleResetFilters}
      />

      <div className="space-y-4" id="report-content">
        {children({
          historicalFilteredTransactions,
          combinedFilteredTransactions: dataProps.filteredTransactions,
          futureFilteredTransactions,
          accounts,
          budgets,
        })}
      </div>
    </div>
  );
};

export default ReportLayout;