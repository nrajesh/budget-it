import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig } from "@/components/ui/chart";
import { BalanceOverTimeChart } from "@/components/BalanceOverTimeChart";
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { useTransactions } from "@/contexts/TransactionsContext";
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
  const { transactions } = useTransactions();

  const availableAccounts = React.useMemo(() => {
    const accounts = new Set<string>();
    transactions.forEach(t => accounts.add(t.account));
    return Array.from(accounts).map(account => ({
      value: slugify(account),
      label: account,
    }));
  }, [transactions]);

  const availableCategories = React.useMemo(() => {
    const categories = new Set<string>();
    transactions.forEach(t => categories.add(t.category));
    return Array.from(categories).map(category => ({
      value: slugify(category),
      label: category,
    }));
  }, [transactions]);

  // Initialize selectedAccounts and selectedCategories to include all available options by default
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>(
    availableAccounts.map(acc => acc.value)
  );
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    availableCategories.map(cat => cat.value)
  );

  // Update selectedAccounts/Categories if available options change (e.g., new transactions added)
  React.useEffect(() => {
    setSelectedAccounts(prev => {
      const currentAccountValues = availableAccounts.map(acc => acc.value);
      // If all were selected, keep all selected. Otherwise, maintain current selections if they still exist.
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
    let filtered = transactions;

    if (selectedAccounts.length > 0) {
      filtered = filtered.filter(t => selectedAccounts.includes(slugify(t.account)));
    }

    // Note: Category filtering for the table is now handled inside RecentTransactions
    // This `filtered` list is primarily for charts that need pre-filtered data.
    return filtered;
  }, [transactions, selectedAccounts]);

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
          <BalanceOverTimeChart transactions={filteredTransactions} />
        </div>
        <div className="lg:col-span-1">
          <SpendingCategoriesChart transactions={filteredTransactions} />
        </div>
      </div>
      <RecentTransactions transactions={filteredTransactions} selectedCategories={selectedCategories.map(slugify)} />
    </div>
  );
};

export default Analytics;