import React from 'react';
import ExportButtons from '@/components/reports/ExportButtons';
import NetWorthStatement from '@/components/reports/NetWorthStatement';
import IncomeExpenseSummary from '@/components/reports/IncomeExpenseSummary';
import TrendsAndAnalytics from '@/components/reports/TrendsAndAnalytics';
import { useTransactions } from '@/contexts/TransactionsContext';
import { showSuccess } from '@/utils/toast';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import { useTransactionData } from '@/hooks/transactions/useTransactionData';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

const EssentialReports = () => {
  const { accounts } = useTransactions();

  // Use the filters hook to get all filter states and handlers
  const {
    searchTerm,
    setSearchTerm,
    selectedAccounts,
    setSelectedAccounts,
    selectedCategories,
    setSelectedCategories,
    selectedVendors,
    setSelectedVendors,
    dateRange,
    setDateRange,
    availableAccountOptions,
    availableCategoryOptions,
    availableVendorOptions,
    handleResetFilters,
  } = useTransactionFilters();

  // Use the central data hook to get transactions combined with future scheduled events
  const { filteredTransactions: combinedFilteredTransactions } = useTransactionData({
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedVendors,
    dateRange,
    availableAccountOptions,
    availableCategoryOptions,
    availableVendorOptions,
  });

  // Essential reports should only be based on historical data
  const historicalFilteredTransactions = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return combinedFilteredTransactions.filter(t => new Date(t.date) <= today);
  }, [combinedFilteredTransactions]);

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
          <ExportButtons 
            onPdfExport={handlePdfExport}
            onExcelExport={handleExcelExport}
            onCsvExport={handleCsvExport}
          />
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <TransactionFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            availableAccountOptions={availableAccountOptions}
            selectedAccounts={selectedAccounts}
            setSelectedAccounts={setSelectedAccounts}
            availableCategoryOptions={availableCategoryOptions}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            availableVendorOptions={availableVendorOptions}
            selectedVendors={selectedVendors}
            setSelectedVendors={setSelectedVendors}
            dateRange={dateRange}
            onDateChange={setDateRange}
            onResetFilters={handleResetFilters}
          />
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <NetWorthStatement transactions={historicalFilteredTransactions} accounts={accounts} />
        <IncomeExpenseSummary transactions={historicalFilteredTransactions} />
        <TrendsAndAnalytics transactions={historicalFilteredTransactions} />
      </div>
    </div>
  );
};

export default EssentialReports;