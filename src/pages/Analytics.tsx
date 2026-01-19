import * as React from "react";
import { BalanceOverTimeChart } from "@/components/BalanceOverTimeChart";
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { useTransactions } from "@/contexts/TransactionsContext";
import { SmartSearchInput } from "@/components/SmartSearchInput";
import { ActiveFiltersDisplay } from "@/components/ActiveFiltersDisplay";
import { slugify, cn } from "@/lib/utils";
import { useTransactionData } from "@/hooks/transactions/useTransactionData";
import { useTheme } from "@/contexts/ThemeContext";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";

const Analytics = () => {
  const { transactions, categories: allCategories } = useTransactions();
  const { isFinancialPulse } = useTheme();

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
    <div className={cn(
      "space-y-4 transition-colors duration-500",
      isFinancialPulse ? "bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6 rounded-xl -m-6 min-h-[calc(100vh-100px)] text-white" : ""
    )}>
      {isFinancialPulse ? (
        <div className="mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Analytics Pulse
          </h1>
          <p className="text-slate-400 mt-2">Deep dive into your financial health.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Deep dive into your financial data</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <SmartSearchInput />
        <ActiveFiltersDisplay />
      </div>
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
