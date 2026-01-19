import * as React from "react";
import { BalanceOverTimeChart } from "@/components/BalanceOverTimeChart";
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { useTransactions } from "@/contexts/TransactionsContext";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { slugify } from "@/lib/utils";
import { useTransactionData } from "@/hooks/transactions/useTransactionData";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";

const Analytics = () => {
  const { transactions, categories: allCategories } = useTransactions();

  const {
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedSubCategories,
    selectedVendors,
    dateRange,
    excludeTransfers,
    minAmount,
    maxAmount,
    limit,
    sortOrder
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

      // Also apply min/max amount filter to "currentTransactions" which feeds SpendingCategoriesChart?
      // SpendingCategoriesChart usually shows spending breakdown. It should probably respect amount filters too.
      // But `useTransactionData` is used for `allFilteredData`/`BalanceOverTimeChart`.
      // `SpendingCategoriesChart` uses `currentTransactions`.
      // Let's add amount filter here too for consistency if relevant.
      const matchesAmount =
        (minAmount === undefined || Math.abs(t.amount) >= minAmount) &&
        (maxAmount === undefined || Math.abs(t.amount) <= maxAmount);

      return isNotFuture && isInDateRange && matchesAmount;
    });
  }, [transactions, dateRange, minAmount, maxAmount]);



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






  // Use the useTransactionData hook to handle filtering and projection
  const { filteredTransactions: allFilteredData } = useTransactionData({
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedSubCategories,
    selectedVendors,
    dateRange,
    availableAccountOptions: availableAccounts,
    availableCategoryOptions: availableCategories,
    availableVendorOptions: availableVendors,
    excludeTransfers,
    minAmount,
    maxAmount,
    limit,
    sortOrder
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
    <div className="space-y-6 p-6 rounded-xl min-h-[calc(100vh-100px)] transition-all duration-500 bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
          Analytics Pulse
        </h1>
        <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">Deep dive into your financial health.</p>
      </div>

      <SearchFilterBar />
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BalanceOverTimeChart
            transactions={filteredTransactions}
            projectedTransactions={filteredScheduledTransactions}
            dateRange={dateRange}
          />
        </div>
        <div className="lg:col-span-1">
          <SpendingCategoriesChart transactions={currentTransactions} />
        </div>
      </div>

      {allFilteredData.length > 0 && (
        <RecentTransactions transactions={allFilteredData} selectedCategories={selectedCategories.map(slugify)} />
      )}
    </div>
  );
};

export default Analytics;
