import * as React from 'react';
import { useTheme } from "@/contexts/ThemeContext";
import { ThemedCard, ThemedCardHeader, ThemedCardTitle } from '@/components/ThemedCard';
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
import { cn, slugify } from '@/lib/utils'; // Make sure to import cn
import { useDataProvider } from '@/context/DataProviderContext';

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

  const handlePdfExport = () => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let yPos = 20;

      doc.setFontSize(18);
      doc.text(title, 14, yPos);
      yPos += 15;

      const reportContent = document.getElementById('report-content');
      if (!reportContent) {
        showError("Could not find report content to export.");
        return;
      }

      const tables = Array.from(reportContent.querySelectorAll('table'));

      if (tables.length === 0) {
        showError("No tabular data found in the report to export.");
        return;
      }

      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("Note: This PDF export includes tabular data only. Charts and other visual elements are not included.", 14, yPos);
      yPos += 15;
      doc.setTextColor(0);

      tables.forEach((table) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        const card = table.closest('div[class*="rounded-lg border"]');
        let finalTitle = "Data Table";
        if (card) {
          const cardTitleEl = card.querySelector('h3');
          const sectionTitleEl = table.closest('div')?.querySelector('h3.text-lg');
          finalTitle = sectionTitleEl?.textContent?.trim() || cardTitleEl?.textContent?.trim() || "Data Table";
        }

        doc.setFontSize(14);
        doc.text(finalTitle, 14, yPos);
        yPos += 10;

        autoTable(doc, {
          html: table,
          startY: yPos,
          theme: 'grid',
          headStyles: { fillColor: '#16a34a' }, // green-600
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      });

      doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
      showSuccess("PDF export started. Your download will begin shortly.");
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

      <ThemedCard>
        <ThemedCardHeader>
          <ThemedCardTitle>Report Filters</ThemedCardTitle>
          <TransactionFilters
            {...filterProps}
            availableAccountOptions={availableAccountOptions}
            availableVendorOptions={availableVendorOptions}
            categoryTreeData={categoryTreeData}
            onDateChange={filterProps.setDateRange}
            onExcludeTransfersChange={filterProps.setExcludeTransfers}
            onResetFilters={filterProps.handleResetFilters}
          />
        </ThemedCardHeader>
      </ThemedCard>

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