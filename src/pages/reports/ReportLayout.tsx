import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import ExportButtons from '@/components/reports/ExportButtons';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import { useTransactionData } from '@/hooks/transactions/useTransactionData';
import { useTransactions } from '@/contexts/TransactionsContext';
import { showSuccess, showError } from '@/utils/toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportLayoutProps {
  title: string;
  description: React.ReactNode;
  children: (props: {
    historicalFilteredTransactions: any[];
    combinedFilteredTransactions: any[];
    futureFilteredTransactions: any[];
    accounts: any[];
  }) => React.ReactNode;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({ title, description, children }) => {
  const { accounts } = useTransactions();
  const filterProps = useTransactionFilters();
  const dataProps = useTransactionData(filterProps);

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

      // Select all tables within the report content
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
        if (yPos > 260) { // Check if new page is needed before adding a new table
          doc.addPage();
          yPos = 20;
        }

        // Attempt to find a title for the table from its parent card or section
        const card = table.closest('div[class*="rounded-lg border"]');
        let sectionTitle = "Data Table";
        if (card) {
          const cardTitleEl = card.querySelector('h3'); // For Income/Expense Summary
          const cardHeaderTitleEl = card.querySelector('div > h2'); // For Net Worth Statement
          sectionTitle = cardTitleEl?.textContent?.trim() || cardHeaderTitleEl?.textContent?.trim() || "Data Table";
        }

        doc.setFontSize(14);
        doc.text(sectionTitle, 14, yPos);
        yPos += 10;

        autoTable(doc, {
          html: table,
          startY: yPos,
          theme: 'grid',
          headStyles: { fillColor: '#16a34a' }, // green-600
          didParseCell: (data) => {
            // Apply text color for positive/negative amounts in cells
            if (data.cell.raw instanceof HTMLElement) {
              const style = window.getComputedStyle(data.cell.raw);
              if (style.color === 'rgb(34, 197, 94)') { // Tailwind green-500
                data.cell.styles.textColor = '#22c55e';
              } else if (style.color === 'rgb(239, 68, 68)') { // Tailwind red-500
                data.cell.styles.textColor = '#ef4444';
              }
            }
          },
        });
        yPos = (doc as any).lastAutoTable.finalY + 15; // Update yPos for the next element
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <div className="text-muted-foreground">{description}</div>
        </div>
        <ExportButtons
          onPdfExport={handlePdfExport}
          onExcelExport={handleExcelExport}
          onCsvExport={handleCsvExport}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <TransactionFilters
            {...filterProps}
            onDateChange={filterProps.setDateRange}
            onResetFilters={filterProps.handleResetFilters}
          />
        </CardHeader>
      </Card>

      <div className="space-y-4" id="report-content">
        {children({
          historicalFilteredTransactions,
          combinedFilteredTransactions: dataProps.filteredTransactions,
          futureFilteredTransactions,
          accounts,
        })}
      </div>
    </div>
  );
};

export default ReportLayout;