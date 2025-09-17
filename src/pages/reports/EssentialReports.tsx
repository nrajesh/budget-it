import React from 'react';
import { DateRangePicker } from '@/components/DateRangePicker';
import ExportButtons from '@/components/reports/ExportButtons';
import NetWorthStatement from '@/components/reports/NetWorthStatement';
import IncomeExpenseSummary from '@/components/reports/IncomeExpenseSummary';
import TrendsAndAnalytics from '@/components/reports/TrendsAndAnalytics';
import { useTransactions } from '@/contexts/TransactionsContext';
import { DateRange } from 'react-day-picker';
import { showSuccess } from '@/utils/toast';

const EssentialReports = () => {
  const { transactions, accounts } = useTransactions();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

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

  const handlePdfExport = () => showSuccess("PDF export is not yet implemented.");
  const handleExcelExport = () => showSuccess("Excel export is not yet implemented.");
  const handleCsvExport = () => showSuccess("CSV export is not yet implemented.");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Essential Reports</h2>
          <p className="text-muted-foreground">Your core financial summaries and trends.</p>
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

      <div className="space-y-4">
        <NetWorthStatement transactions={filteredTransactions} accounts={accounts} />
        <IncomeExpenseSummary transactions={filteredTransactions} />
        <TrendsAndAnalytics transactions={filteredTransactions} />
      </div>
    </div>
  );
};

export default EssentialReports;