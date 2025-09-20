import React from 'react';
import { Link } from 'react-router-dom';
import ExportButtons from '@/components/reports/ExportButtons';
import SankeyChart from '@/components/reports/SankeyChart';
import AlertsAndInsights from '@/components/reports/AlertsAndInsights';
import TrendForecastingChart from '@/components/reports/TrendForecastingChart';
import { showSuccess } from '@/utils/toast';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import { useTransactionData } from '@/hooks/transactions/useTransactionData';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

const AdvancedReports = () => {
  const { accounts } = useTransactions();
  const [futureMonths, setFutureMonths] = React.useState(2);

  // This effect will run on component mount and keep the displayed value in sync
  // with the setting, even if the user navigates away and back.
  React.useEffect(() => {
    const savedMonths = localStorage.getItem('futureMonths');
    if (savedMonths) {
      setFutureMonths(parseInt(savedMonths, 10));
    }
  }, []);

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

  // Create historical and future-only versions for the new components
  const { historicalFilteredTransactions, futureFilteredTransactions } = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const historical = combinedFilteredTransactions.filter(t => new Date(t.date) <= today);
    const future = combinedFilteredTransactions.filter(t => new Date(t.date) > today && t.is_scheduled_origin);
    return { historicalFilteredTransactions: historical, futureFilteredTransactions: future };
  }, [combinedFilteredTransactions]);

  const handlePdfExport = () => showSuccess("PDF export is not yet implemented.");
  const handleExcelExport = () => showSuccess("Excel export is not yet implemented.");
  const handleCsvExport = () => showSuccess("CSV export is not yet implemented.");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Reports</h2>
          <p className="text-muted-foreground">
            Future projections for the next {futureMonths} months. You can change this in{' '}
            <Link to="/settings" className="text-primary underline">
              Settings
            </Link>
            .
          </p>
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
        {/* New Alerts and Insights component at the top */}
        <AlertsAndInsights 
          historicalTransactions={historicalFilteredTransactions}
          futureTransactions={futureFilteredTransactions}
          accounts={accounts}
        />
        
        {/* The forecasting chart receives all data, including future events */}
        <TrendForecastingChart transactions={combinedFilteredTransactions} />
        
        {/* Sankey chart receives only historical data */}
        <SankeyChart transactions={historicalFilteredTransactions} accounts={accounts} />
      </div>
    </div>
  );
};

export default AdvancedReports;