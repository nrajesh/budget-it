import * as React from "react";
import { BalanceOverTimeChart } from "@/components/BalanceOverTimeChart";
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { useTransactions } from "@/contexts/TransactionsContext";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { slugify, cn } from "@/lib/utils";
import { useTransactionData } from "@/hooks/transactions/useTransactionData";
import { useTheme } from "@/contexts/ThemeContext";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";

const Analytics = () => {
  const { transactions, categories: allCategories, subCategories: allSubCategories } = useTransactions();
  const { isFinancialPulse } = useTheme();

  const {
    searchTerm, setSearchTerm,
    selectedAccounts, setSelectedAccounts,
    selectedCategories, setSelectedCategories,
    selectedSubCategories, setSelectedSubCategories,
    selectedVendors, setSelectedVendors,
    dateRange, setDateRange,
    excludeTransfers, setExcludeTransfers,
    handleResetFilters
  } = useTransactionFilters();

  const currentTransactions = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0);

      const isNotFuture = transactionDate <= today;
      const isInDateRange =
        (!dateRange?.from || transactionDate >= dateRange.from) &&
        (!dateRange?.to || transactionDate <= dateRange.to);

      return isNotFuture && isInDateRange;
    });
  }, [transactions, dateRange]);



  const availableAccounts = React.useMemo(() => {
    const uniqueAccounts = new Set<string>();
    currentTransactions.forEach(t => uniqueAccounts.add(t.account));
    return Array.from(uniqueAccounts).sort().map(account => ({
      value: slugify(account),
      label: account,
    }));
  }, [currentTransactions]);

  const availableVendors = React.useMemo(() => {
    const uniqueVendors = new Set<string>();
    currentTransactions.forEach(t => {
      if (t.vendor) uniqueVendors.add(t.vendor);
    });
    return Array.from(uniqueVendors).sort().map(vendor => ({
      value: slugify(vendor),
      label: vendor,
    }));
  }, [currentTransactions]);

  const availableCategories = React.useMemo(() => {
    return allCategories.map(category => ({
      value: slugify(category.name),
      label: category.name,
    }));
  }, [allCategories]);

  const categoryTreeData = React.useMemo(() => {
    return allCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: slugify(cat.name),
      subCategories: allSubCategories
        .filter(sub => sub.category_id === cat.id)
        .map(sub => ({
          id: sub.id,
          name: sub.name,
          slug: slugify(sub.name)
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCategories, allSubCategories]);




  // Use the useTransactionData hook to handle filtering and projection
  const { filteredTransactions: allFilteredData } = useTransactionData({
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedVendors,
    dateRange,
    availableAccountOptions: availableAccounts,
    availableCategoryOptions: availableCategories,
    availableVendorOptions: availableVendors,
    excludeTransfers
  });

  // Split into historical and projected for the chart, but use combined for the table
  const { historicalTransactions, projectedTransactions } = React.useMemo(() => {
    const historical: any[] = [];
    const projected: any[] = [];

    allFilteredData.forEach(t => {
      // We can use the flag 'is_scheduled_origin' or date.
      // Using flag is safer if we want to distinguish "planned" vs "actual"
      if (t.is_scheduled_origin) {
        projected.push(t);
      } else {
        historical.push(t);
      }
    });

    return { historicalTransactions: historical, projectedTransactions: projected };
  }, [allFilteredData]);

  const filteredTransactions = historicalTransactions;
  const filteredScheduledTransactions = projectedTransactions;



  return (
    <div className={cn(
      "space-y-4 transition-colors duration-500",
      isFinancialPulse ? "bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6 rounded-xl -m-6 min-h-[calc(100vh-100px)] text-white" : ""
    )}>
      {isFinancialPulse && (
        <div className="mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Analytics Pulse
          </h1>
          <p className="text-slate-400 mt-2">Deep dive into your financial health.</p>
        </div>
      )}

      <TransactionFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        availableAccountOptions={availableAccounts}
        selectedAccounts={selectedAccounts}
        setSelectedAccounts={setSelectedAccounts}

        categoryTreeData={categoryTreeData}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedSubCategories={selectedSubCategories}
        setSelectedSubCategories={setSelectedSubCategories}

        availableVendorOptions={availableVendors}
        selectedVendors={selectedVendors}
        setSelectedVendors={setSelectedVendors}
        dateRange={dateRange}
        onDateChange={setDateRange}
        excludeTransfers={excludeTransfers}
        onExcludeTransfersChange={setExcludeTransfers}
        onResetFilters={handleResetFilters}
      />
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BalanceOverTimeChart
            transactions={filteredTransactions}
            projectedTransactions={filteredScheduledTransactions}
            dateRange={dateRange}
          />
        </div>
        <div className="lg:col-span-1">
          <SpendingCategoriesChart transactions={allFilteredData} />
        </div>
      </div>

      {allFilteredData.length > 0 && (
        <RecentTransactions transactions={allFilteredData} selectedCategories={selectedCategories.map(slugify)} />
      )}
    </div>
  );
};

export default Analytics;
