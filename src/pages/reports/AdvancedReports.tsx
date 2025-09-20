import React from 'react';
import { DateRangePicker } from '@/components/DateRangePicker';
import ExportButtons from '@/components/reports/ExportButtons';
import SankeyChart from '@/components/reports/SankeyChart'; // Import SankeyChart
import AlertsAndInsights from '@/components/reports/AlertsAndInsights';
import { DateRange } from 'react-day-picker';
import { showSuccess } from '@/utils/toast';
import { useTransactions } from '@/contexts/TransactionsContext'; // Import useTransactions

const AdvancedReports = () => {
  const { transactions, accounts } = useTransactions(); // Get transactions and accounts
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  const handlePdfExport = () => showSuccess("PDF export is not yet implemented.");
  const handleExcelExport = () => showSuccess("Excel export is not yet implemented.");
  const handleCsvExport = () => showSuccess("CSV export is not yet implemented.");

  const filteredTransactions = React.useMemo(() => {
    if (!dateRange?.from) return transactions;
    const fromDate = dateRange.from;
    const toDate = dateRange.to || new Date();
    toDate.setHours(23, 59, 59, 999);
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= fromDate && transactionDate <= toDate;
    });
  }, [transactions, dateRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Reports</h2>
          <p className="text-muted-foreground">Future projections and intelligent insights.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <DateRangePicker dateRange={dateRange} onDateChange={setDateRange} />
          <ExportButtons 
            onPdfExport={handlePdfExport}
            onExcelExport={handleExcelExport}
            onCsvExport={handleCsvExport}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SankeyChart transactions={filteredTransactions} accounts={accounts} />
        <AlertsAndInsights />
      </div>
    </div>
  );
};

export default AdvancedReports;