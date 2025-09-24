import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import ExportButtons from '@/components/reports/ExportButtons';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import { useTransactionData } from '@/hooks/transactions/useTransactionData';
import { useTransactions } from '@/contexts/TransactionsContext';
import { showSuccess, showError } from '@/utils/toast';
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

  const handleDoclingExport = async () => {
    try {
      showSuccess("Starting export process...");
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

      const payload = {
        reportTitle: title,
        tables: tablesData,
      };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showError("You must be logged in to export reports.");
        return;
      }

      const response = await fetch('https://idvgwvndnqvlcndjfwat.supabase.co/functions/v1/create-docling-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server failed to create document.');
      }

      const result = await response.json();
      showSuccess(`Docling document created: ${result.document_key}`);

    } catch (error: any) {
      console.error("Docling export failed:", error);
      showError(`Docling export failed: ${error.message}`);
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
          onPdfExport={handleDoclingExport}
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