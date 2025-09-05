import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/contexts/TransactionsContext";
import { TrendingUp, TrendingDown, Scale, Hash } from "lucide-react";
import { BalanceOverTimeChart } from "@/components/BalanceOverTimeChart";
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { type ChartConfig } from "@/components/ui/chart";
import { accounts as allAccounts } from "@/data/finance-data";
import { slugify } from "@/lib/utils";
import { MultiSelectDropdown } from "@/components/MultiSelectDropdown";
import { useCurrency } from "@/contexts/CurrencyContext";

const AnalyticsPage = () => {
  const { transactions } = useTransactions();
  const { formatCurrency } = useCurrency();

  // Account State
  const allAccountNames = React.useMemo(() => allAccounts, []);
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>(allAccountNames);

  // Category State
  const allCategoryNames = React.useMemo(() => {
    const categories = new Set(transactions.map(t => t.category)); // Include all categories
    return Array.from(categories).sort();
  }, [transactions]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(allCategoryNames);

  React.useEffect(() => {
    // Reset selected categories when allCategoryNames changes (e.g., on initial load or transaction update)
    setSelectedCategories(allCategoryNames);
  }, [allCategoryNames]);

  // Account Toggle Handlers
  const handleAccountToggle = (accountName: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountName) ? prev.filter(a => a !== accountName) : [...prev, accountName]
    );
  };
  const handleAccountToggleAll = () => {
    setSelectedAccounts(prev => prev.length === allAccountNames.length ? [] : allAccountNames);
  };

  // Category Toggle Handlers
  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName) ? prev.filter(c => c !== categoryName) : [...prev, categoryName]
    );
  };
  const handleCategoryToggleAll = () => {
    setSelectedCategories(prev => prev.length === allCategoryNames.length ? [] : allCategoryNames);
  };

  // Chart Config for Accounts
  const chartConfigForAccounts = React.useMemo(() => {
    const config: ChartConfig = {};
    allAccounts.forEach((account, index) => {
      config[slugify(account)] = { label: account, color: `hsl(var(--chart-${index + 1}))` };
    });
    return config;
  }, []);

  // Filtered Transactions (by account)
  const filteredTransactions = React.useMemo(() => {
    const selectedAccountSlugs = selectedAccounts.map(slugify);
    return transactions.filter(t => selectedAccountSlugs.includes(slugify(t.account)));
  }, [transactions, selectedAccounts]);

  // Non-transfer filtered transactions (for metrics and spending chart)
  const nonTransferFilteredTransactions = React.useMemo(() => {
    return filteredTransactions.filter(t => t.category !== 'Transfer');
  }, [filteredTransactions]);

  // Financial Metrics
  const { totalIncome, totalExpenses, netBalance } = React.useMemo(() => {
    const income = nonTransferFilteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = nonTransferFilteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome: income, totalExpenses: expenses, netBalance: income + expenses };
  }, [nonTransferFilteredTransactions]);

  // Spending Chart Data (filtered by selected categories and excluding transfers)
  const { spendingData, spendingConfig } = React.useMemo(() => {
    const spendingByCategory = nonTransferFilteredTransactions
      .filter(t => t.amount < 0 && selectedCategories.includes(t.category))
      .reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = 0;
        acc[t.category] += Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const data = Object.entries(spendingByCategory).map(([name, value], index) => ({
      name, value, fill: `hsl(var(--chart-${index + 1}))`,
    })).sort((a, b) => b.value - a.value);

    const config = data.reduce((acc, item) => {
      acc[slugify(item.name)] = { label: item.name, color: item.fill };
      return acc;
    }, {} as ChartConfig);

    return { spendingData: data, spendingConfig: config };
  }, [nonTransferFilteredTransactions, selectedCategories]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Income</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Net Balance</CardTitle><Scale className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(netBalance)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Transactions</CardTitle><Hash className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{nonTransferFilteredTransactions.length}</div></CardContent>
        </Card>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <MultiSelectDropdown
              title="Accounts"
              options={allAccountNames}
              selectedOptions={selectedAccounts}
              onToggleOption={handleAccountToggle}
              onToggleAll={handleAccountToggleAll}
            />
            <MultiSelectDropdown
              title="Categories"
              options={allCategoryNames}
              selectedOptions={selectedCategories}
              onToggleOption={handleCategoryToggle}
              onToggleAll={handleCategoryToggleAll}
            />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <BalanceOverTimeChart transactions={filteredTransactions} selectedAccounts={selectedAccounts.map(slugify)} chartConfig={chartConfigForAccounts} />
        <SpendingCategoriesChart data={spendingData} config={spendingConfig} />
      </div>
      <div className="grid gap-4">
        <RecentTransactions transactions={filteredTransactions} selectedCategories={selectedCategories} />
      </div>
    </div>
  );
};

export default AnalyticsPage;