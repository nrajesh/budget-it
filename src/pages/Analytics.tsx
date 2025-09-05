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
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

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

  const filteredTransactions = React.useMemo(() => {
    let filtered = transactions;

    if (selectedAccounts.length > 0) {
      filtered = filtered.filter(t => selectedAccounts.includes(slugify(t.account)));
    }

    // Note: Category filtering for the table is now handled inside RecentTransactions
    // This `filtered` list is primarily for charts that need pre-filtered data.
    return filtered;
  }, [transactions, selectedAccounts]);

  // Prepare data for SpendingCategoriesChart (it now takes transactions directly)
  // const spendingData = React.useMemo(() => { /* ... logic moved inside SpendingCategoriesChart ... */ }, [filteredTransactions]);
  // const spendingConfig = React.useMemo(() => { /* ... logic moved inside SpendingCategoriesChart ... */ }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <MultiSelectDropdown
          options={availableAccounts}
          selectedValues={selectedAccounts}
          onSelectChange={setSelectedAccounts}
          placeholder="Filter by Account"
        />
        <MultiSelectDropdown
          options={availableCategories}
          selectedValues={selectedCategories}
          onSelectChange={setSelectedCategories}
          placeholder="Filter by Category"
        />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <BalanceOverTimeChart transactions={filteredTransactions} /> {/* Removed selectedAccounts and chartConfig props */}
        <SpendingCategoriesChart transactions={filteredTransactions} /> {/* Updated prop */}
      </div>
      <RecentTransactions transactions={filteredTransactions} selectedCategories={selectedCategories.map(slugify)} />
    </div>
  );
};

export default Analytics;