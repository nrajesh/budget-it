import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/contexts/TransactionsContext";
import { DollarSign, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { IncomeVsExpensesChart } from "@/components/IncomeVsExpensesChart";
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { type ChartConfig } from "@/components/ui/chart";

const AnalyticsPage = () => {
  const { transactions } = useTransactions();

  const { totalIncome, totalExpenses, netBalance } = React.useMemo(() => {
    const income = transactions
      .filter(t => t.amount > 0 && t.category !== 'Transfer')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.amount < 0 && t.category !== 'Transfer')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income + expenses,
    };
  }, [transactions]);

  const { spendingData, spendingConfig } = React.useMemo(() => {
    const spendingByCategory = transactions
      .filter(t => t.amount < 0 && t.category !== 'Transfer')
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
  }, [transactions]);

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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter(t => t.category !== 'Transfer').length}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <IncomeVsExpensesChart />
        <SpendingCategoriesChart data={spendingData} config={spendingConfig} />
      </div>
      <div className="grid gap-4">
        <RecentTransactions />
      </div>
    </div>
  );
};

export default AnalyticsPage;