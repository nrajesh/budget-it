import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig } from "@/components/ui/chart";
import { BalanceOverTimeChart } from "@/components/BalanceOverTimeChart";
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { useTransactions } from "@/contexts/TransactionsContext";
import { MultiSelectDropdown } from "@/components/MultiSelectDropdown";
import { slugify } from "@/lib/utils";
import { DatePickerWithRange } from "@/components/DatePickerWithRange"; // Import the new component
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

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
  const { transactions, categories: allCategories } = useTransactions();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30), // Default to last 30 days
    to: new Date(),
  });

  // Filter transactions to exclude future-dated ones and apply date range
  const currentTransactions = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0); // Normalize transaction date

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
    return Array.from(uniqueAccounts).map(account => ({
      value: slugify(account),
      label: account,
    }));
  }, [currentTransactions]);

  const availableCategories = React.useMemo(() => {
    return allCategories.map(category => ({
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

    // Apply category filter for RecentTransactions and SpendingCategoriesChart
    // Note: BalanceOverTimeChart does not use category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(slugify(t.category)));
    }

    return filtered;
  }, [currentTransactions, selectedAccounts, selectedCategories]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="date-range-filter" className="text-sm font-medium text-foreground">Date Range</label>
          <DatePickerWithRange
            id="date-range-filter"
            date={dateRange}
            onDateChange={setDateRange}
          />
        </div>
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