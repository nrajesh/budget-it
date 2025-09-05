import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/contexts/TransactionsContext";
import { DollarSign, TrendingUp, TrendingDown, Scale, Hash } from "lucide-react";
import { BalanceOverTimeChart } from "@/components/BalanceOverTimeChart";
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { type ChartConfig } from "@/components/ui/chart";
import { accounts as allAccounts, type Transaction } from "@/data/finance-data";
import { AccountFilter } from "@/components/AccountFilter";
import { slugify } from "@/lib/utils"; // Import slugify from utils

const AnalyticsPage = () => {
  const { transactions } = useTransactions();
  const accountSlugs = React.useMemo(() => allAccounts.map(slugify), []);
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>(accountSlugs);

  const chartConfigForAccounts = React.useMemo(() => {
    const config: ChartConfig = {};
    allAccounts.forEach((account, index) => {
      const slug = slugify(account);
      config[slug] = {
        label: account,
        color: `hsl(var(--chart-${index + 1}))`,
      };
    });
    return config;
  }, []);

  const handleAccountToggle = (accountSlug: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountSlug)
        ? prev.filter(a => a !== accountSlug)
        : [...prev, accountSlug]
    );
  };

  const filteredTransactions = React.useMemo(() => {
    if (selectedAccounts.length === accountSlugs.length) {
      return transactions;
    }
    return transactions.filter(t => selectedAccounts.includes(slugify(t.account)));
  }, [transactions, selectedAccounts, accountSlugs]);

  // Memoize non-transfer transactions to avoid repeated filtering
  const nonTransferFilteredTransactions = React.useMemo(() => {
    return filteredTransactions.filter(t => t.category !== 'Transfer');
  }, [filteredTransactions]);

  const { totalIncome, totalExpenses, netBalance } = React.useMemo(() => {
    const income = nonTransferFilteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = nonTransferFilteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income + expenses,
    };
  }, [nonTransferFilteredTransactions]);

  const { spendingData, spendingConfig } = React.useMemo(() => {
    const spendingByCategory = nonTransferFilteredTransactions
      .filter(t => t.amount < 0)
      .reduce((acc, t) => {
        const category = t.category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const data = Object.entries(spendingByCategory)
      .map(([name, value], index) => ({
        name,
        value,
        fill: `hsl(var(--chart-${index + 1}))`,
      }))
      .sort((a, b) => b.value - a.value);

    const config = data.reduce((acc, item) => {
      const key = item.name.toLowerCase().replace(/\s+/g, '-');
      acc[key] = { label: item.name, color: item.fill };
      return acc;
    }, {} as ChartConfig);

    return { spendingData: data, spendingConfig: config };
  }, [nonTransferFilteredTransactions]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalIncome)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(netBalance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nonTransferFilteredTransactions.length}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4">
        <AccountFilter
          allAccounts={allAccounts}
          selectedAccounts={selectedAccounts}
          onAccountToggle={handleAccountToggle}
          chartConfig={chartConfigForAccounts}
        />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <BalanceOverTimeChart 
          transactions={filteredTransactions} 
          selectedAccounts={selectedAccounts}
          chartConfig={chartConfigForAccounts}
        />
        <SpendingCategoriesChart data={spendingData} config={spendingConfig} />
      </div>
      <div className="grid gap-4">
        <RecentTransactions transactions={filteredTransactions} />
      </div>
    </div>
  );
};

export default AnalyticsPage;