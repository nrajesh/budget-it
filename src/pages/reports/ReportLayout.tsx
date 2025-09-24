import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import ExportButtons from '@/components/reports/ExportButtons';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import { useTransactionData } from '@/hooks/transactions/useTransactionData';
import { useTransactions } from '@/contexts/TransactionsContext';
import { showSuccess, showError, showToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';

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

  const handlePdfExport = async () => {
    const toastId = showToast("Generating your report... This may take a moment.");
    try {
      // 1. Find the main content area of the report.
      const reportContent = document.getElementById('report-content');
      if (!reportContent) {
        throw new Error("Could not find report content to export.");
      }

      // 2. Extract all tables and their corresponding titles.
      const tables = Array.from(reportContent.querySelectorAll('table'));
      if (tables.length === 0) {
        throw new Error("No data tables found in the report to export.");
      }

      const tablesData = tables.map(table => {
        const card = table.closest('div[class*="rounded-lg border"]');
        let tableTitle = "Data Table";
        if (card) {
          const cardTitleEl = card.querySelector('h3');
          const sectionTitleEl = table.closest('div')?.querySelector('h3.text-lg');
          tableTitle = sectionTitleEl?.textContent?.trim() || cardTitleEl?.textContent?.trim() || "Data Table";
        }
        return {
          title: tableTitle,
          html: table.outerHTML
        };
      });

      // 3. Prepare the payload for the backend function.
      const payload = {
        reportTitle: title,
        tables: tablesData,
      };

      // 4. Invoke the Supabase Edge Function.
      const { data, error } = await supabase.functions.invoke('create-docling-pdf-from-html', {
        body: JSON.stringify(payload),
      });

      if (error) throw new Error(`Network error: ${error.message}`);
      if (data.error) throw new Error(`Backend error: ${data.error}`);

      // 5. Receive the download URL and trigger the download.
      if (data.download_url) {
        showSuccess("Report created! Your download will begin automatically.", { id: toastId });
        const link = document.createElement('a');
        link.href = data.download_url;
        link.setAttribute('download', `${title.replace(/\s+/g, '_')}_Report.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error("Export process did not return a download URL.");
      }

    } catch (error: any) {
      console.error("PDF Export failed:", error);
      showError(`PDF Export failed: ${error.message}`, { id: toastId });
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