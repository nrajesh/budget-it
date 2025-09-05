import * as React from "react";
import {
  DollarSign,
  FileText,
} from "lucide-react";
import {
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { incomeVsExpensesData, chartConfig as staticChartConfig } from "@/data/finance-data";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { slugify } from "@/lib/utils";
import { type ChartConfig } from "@/components/ui/chart";

const Index = () => {
  const { transactions } = useTransactions();
  const { formatCurrency, convertCurrency, currency } = useCurrency();

  const { netWorth, monthlySpending } = React.useMemo(() => {
    const nonTransfer = transactions.filter(t => t.category !== 'Transfer');
    const worth = nonTransfer.reduce((sum, t) => sum + t.amount, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthly = nonTransfer
      .filter(t => new Date(t.date) > thirtyDaysAgo && t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);

    return { netWorth: worth, monthlySpending: monthly };
  }, [transactions]);

  const { spendingData, spendingConfig } = React.useMemo(() => {
    const spendingByCategory = transactions
      .filter(t => t.amount < 0 && t.category !== 'Transfer')
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
  }, [transactions]);

  const yAxisFormatter = (value: number) => {
    const converted = convertCurrency(value);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, notation: 'compact', compactDisplay: 'short' }).format(converted);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Check your financial overview
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row">
            <div className="grid flex-1 grid-cols-2 gap-4">
              <div className="rounded-lg bg-primary/80 p-4">
                <p className="text-sm text-primary-foreground/80">
                  Net Worth
                </p>
                <p className="text-2xl font-bold">{formatCurrency(netWorth)}</p>
              </div>
              <div className="rounded-lg bg-primary/80 p-4">
                <p className="text-sm text-primary-foreground/80">
                  Monthly Spending
                </p>
                <p className="text-2xl font-bold">{formatCurrency(monthlySpending)}</p>
              </div>
            </div>
            <div className="hidden sm:block">
              <img
                src="/placeholder.svg"
                alt="Welcome illustration"
                className="h-32 w-32"
              />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Spending
              </CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(monthlySpending)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bills Due
              </CardTitle>
              <FileText className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                2 due this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Net Worth
              </CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(netWorth)}</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={staticChartConfig} className="h-64 w-full">
                <LineChart data={incomeVsExpensesData}>
                  <RechartsTooltip
                    content={<ChartTooltipContent indicator="dot" formatter={(value) => formatCurrency(Number(value))} />}
                  />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={yAxisFormatter}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <div className="lg:col-span-2">
            <SpendingCategoriesChart data={spendingData} config={spendingConfig} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;