import React from 'react';
import ExportButtons from '@/components/reports/ExportButtons';
import SankeyChart from '@/components/reports/SankeyChart';
import AlertsAndInsights from '@/components/reports/AlertsAndInsights';
import TrendForecastingChart from '@/components/reports/TrendForecastingChart'; // Import the new chart
import { showSuccess } from '@/utils/toast';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { slugify } from '@/lib/utils';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

const AdvancedReports = () => {
  const { transactions, accounts } = useTransactions();

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

  const handlePdfExport = () => showSuccess("PDF export is not yet implemented.");
  const handleExcelExport = () => showSuccess("Excel export is not yet implemented.");
  const handleCsvExport = () => showSuccess("CSV export is not yet implemented.");

  // Apply all filters to the transactions data
  const filteredTransactions = React.useMemo(() => {
    let filtered = transactions;

    // Search term filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.vendor.toLowerCase().includes(lowerCaseSearchTerm) ||
          (t.remarks && t.remarks.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    // Account filter
    if (selectedAccounts.length > 0 && selectedAccounts.length !== availableAccountOptions.length) {
      filtered = filtered.filter((t) => selectedAccounts.includes(slugify(t.account)));
    }

    // Category filter
    if (selectedCategories.length > 0 && selectedCategories.length !== availableCategoryOptions.length) {
      filtered = filtered.filter((t) => selectedCategories.includes(slugify(t.category)));
    }

    // Vendor filter
    if (selectedVendors.length > 0 && selectedVendors.length !== availableVendorOptions.length) {
      filtered = filtered.filter((t) => selectedVendors.includes(slugify(t.vendor)));
    }

    // Date range filter
    if (dateRange?.from) {
      const fromDate = dateRange.from;
      const toDate = dateRange.to || new Date();
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= fromDate && transactionDate <= toDate;
      });
    }

    return filtered;
  }, [
    transactions,
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedVendors,
    dateRange,
    availableAccountOptions.length,
    availableCategoryOptions.length,
    availableVendorOptions.length,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Reports</h2>
          <p className="text-muted-foreground">Future projections and intelligent insights.</p>
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
        <TrendForecastingChart transactions={filteredTransactions} />
        <div className="grid gap-4 md:grid-cols-2">
          <SankeyChart transactions={filteredTransactions} accounts={accounts} />
          <AlertsAndInsights />
        </div>
      </div>
    </div>
  );
};

export default AdvancedReports;