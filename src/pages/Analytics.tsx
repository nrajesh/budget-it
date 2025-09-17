import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig } from "@/components/ui/chart";
import BalanceOverTimeChart from "@/components/BalanceOverTimeChart";
import SpendingCategoriesChart from "@/components/SpendingCategoriesChart";
import RecentTransactions from "@/components/RecentTransactions";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { MultiSelectDropdown } from "@/components/MultiSelectDropdown";
import { slugify } from "@/lib/utils";

const chartConfigForAccounts = {
  Checking: {
    label: "Checking",
    color: "hsl(var(--chart-2))",
  },
  Savings: {
    label: "Savings",
    color: "hsl(var(--chart-3))",
  },
  Credit: {
    label: "Credit",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const Analytics = () => {
  const { transactions, accounts, accountCurrencyMap, categories: allCategories } = useTransactions();
  const { formatCurrency } = useCurrency();

  // Filter transactions to exclude future-dated ones
  const currentTransactions = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate <= today;
    });
  }, [transactions]);

  const availableAccounts = React.useMemo(() => {
    const uniqueAccounts = new Set<string>();
    currentTransactions.forEach(t => uniqueAccounts.add(t.account));
    return Array.from(uniqueAccounts).map(account => ({
      value: slugify(account),
      label: account,
    }));
  }, [currentTransactions]);

  const availableCategories = React.useMemo(() => {
    return allCategories.map(category => ({ // Use allCategories from context
      value: slugify(category.name),
      label: category.name,
    }));
  }, [allCategories]);

  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>(
    availableAccounts.map(acc => acc.value)
  );
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    availableCategories.map(cat => cat.value)
  );

  React.useEffect(() => {
    setSelectedAccounts(prev => {
      const currentAccountValues = availableAccounts.map(acc => acc.value);
      if (prev.length === 0 || prev.length === currentAccountValues.length) {
        return currentAccountValues;
      }
      return prev.filter(val => currentAccountValues.includes(val));
    });
  }, [availableAccounts]);

  React.useEffect(() => {
    setSelectedCategories(prev => {
      const currentCategoryValues = availableCategories.map(cat => cat.value);
      if (prev.length === 0 || prev.length === currentCategoryValues.length) {
        return currentCategoryValues;
      }
      return prev.filter(val => currentCategoryValues.includes(val));
    });
  }, [availableCategories]);

  const filteredTransactions = React.useMemo(() => {
    let filtered = currentTransactions;

    if (selectedAccounts.length > 0) {
      filtered = filtered.filter(t => selectedAccounts.includes(slugify(t.account)));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(slugify(t.category)));
    }

    return filtered;
  }, [currentTransactions, selectedAccounts, selectedCategories]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="account-filter" className="text-sm font-medium text-foreground">Account</label>
          <MultiSelectDropdown
            id="account-filter"
            options={availableAccounts}
            selectedValues={selectedAccounts}
            onSelectChange={setSelectedAccounts}
            placeholder="Filter by Account"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="category-filter" className="text-sm font-medium text-foreground">Category</label>
          <MultiSelectDropdown
            id="category-filter"
            options={availableCategories}
            selectedValues={selectedCategories}
            onSelectChange={setSelectedCategories}
            placeholder="Filter by Category"
          />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BalanceOverTimeChart transactions={filteredTransactions} accounts={accounts} />
        </div>
        <div className="lg:col-span-1">
          <SpendingCategoriesChart transactions={filteredTransactions} />
        </div>
      </div>
      <RecentTransactions
        currentTransactions={filteredTransactions}
        accountCurrencyMap={accountCurrencyMap}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default Analytics;