import React from 'react';
import { Outlet } from 'react-router-dom';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import { useTransactions } from '@/contexts/TransactionsContext';
import { ReportTabs } from './ReportTabs';

const ReportLayout = () => {
  const { isLoadingTransactions: isLoading } = useTransactions();
  const { dateRange, setDateRange, filteredTransactions } = useTransactionFilters();

  const contextValue = {
    transactions: filteredTransactions,
    isLoading,
    dateRange,
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Analyze your financial trends.</p>
        </div>
        <DateRangePicker
          date={dateRange}
          onDateChange={setDateRange}
        />
      </header>
      
      <ReportTabs />

      <div className="mt-6">
        <Outlet context={contextValue} />
      </div>
    </div>
  );
};

export default ReportLayout;