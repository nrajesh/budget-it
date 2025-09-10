import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { SpendingByVendorChart } from "@/components/SpendingByVendorChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const Index = () => {
  const { transactions } = useTransactions();
  const { formatCurrency, convertAmount, selectedCurrency } = useCurrency();

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Filter transactions to exclude future-dated ones
  const currentTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate <= today;
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = currentTransactions;

    if (selectedAccounts.length > 0) {
      filtered = filtered.filter(t => selectedAccounts.includes(t.account));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.category));
    }

    return filtered;
  }, [currentTransactions, selectedAccounts, selectedCategories]);

  const monthlySummary = useMemo(() => {
    const summary: { [key: string]: { income: number; expenses: number } } = {};

    currentTransactions.forEach(transaction => {
      const month = new Date(transaction.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!summary[month]) {
        summary[month] = { income: 0, expenses: 0 };
      }

      if (transaction.amount > 0 && transaction.category !== 'Transfer') {
        summary[month].income += transaction.amount;
      } else if (transaction.amount < 0 && transaction.category !== 'Transfer') {
        summary[month].expenses += Math.abs(transaction.amount);
      }
    });

    const sortedMonths = Object.keys(summary).sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedMonths.map(month => ({
      month,
      income: convertAmount(summary[month].income),
      expenses: convertAmount(summary[month].expenses),
    }));
  }, [currentTransactions, convertAmount]);

  const totalBalance = useMemo(() => {
    const balance = currentTransactions.reduce((acc, t) => {
      if (t.category !== 'Transfer') {
        return acc + t.amount;
      }
      return acc;
    }, 0);
    return convertAmount(balance);
  }, [currentTransactions, convertAmount]);

  const totalIncome = useMemo(() => {
    const income = currentTransactions.reduce((acc, t) => {
      if (t.amount > 0 && t.category !== 'Transfer') {
        return acc + t.amount;
      }
      return acc;
    }, 0);
    return convertAmount(income);
  }, [currentTransactions, convertAmount]);

  const totalExpenses = useMemo(() => {
    const expenses = currentTransactions.reduce((acc, t) => {
      if (t.amount < 0 && t.category !== 'Transfer') {
        return acc + Math.abs(t.amount);
      }
      return acc;
    }, 0);
    return convertAmount(expenses);
  }, [currentTransactions, convertAmount]);

  const numberOfActiveAccounts = useMemo(() => {
    const activeAccounts = new Set<string>();
    currentTransactions.forEach(t => activeAccounts.add(t.account));
    return activeAccounts.size;
  }, [currentTransactions]);

  const calculatePercentageChange = (
    data: { [key: string]: number },
    isBalance: boolean = false
  ) => {
    const sortedMonths = Object.keys(data).sort();
    if (sortedMonths.length < 2) {
      return { value: "N/A", isPositive: null };
    }

    const currentMonthKey = sortedMonths[sortedMonths.length - 1];
    const previousMonthKey = sortedMonths[sortedMonths.length - 2];

    const currentMonthValue = data[currentMonthKey] || 0;
    const previousMonthValue = data[previousMonthKey] || 0;

    if (previousMonthValue === 0) {
      return { value: currentMonthValue > 0 ? "N/A (No data last month)" : "0%", isPositive: null };
    }

    const change = ((currentMonthValue - previousMonthValue) / previousMonthValue) * 100;
    const isPositive = change >= 0;
    const sign = isPositive ? "+" : "";
    return { value: `${sign}${change.toFixed(1)}%`, isPositive };
  };

  const monthlyExpensesData = useMemo(() => {
    const data: { [key: string]: number } = {};
    currentTransactions.forEach(transaction => {
      if (transaction.amount < 0 && transaction.category !== 'Transfer') {
        const date = new Date(transaction.date);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        data[yearMonth] = (data[yearMonth] || 0) + Math.abs(transaction.amount);
      }
    });
    return data;
  }, [currentTransactions]);

  const monthlyIncomeData = useMemo(() => {
    const data: { [key: string]: number } = {};
    currentTransactions.forEach(transaction => {
      if (transaction.amount > 0 && transaction.category !== 'Transfer') {
        const date = new Date(transaction.date);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        data[yearMonth] = (data[yearMonth] || 0) + transaction.amount;
      }
    });
    return data;
  }, [currentTransactions]);

  const monthlyBalanceData = useMemo(() => {
    const data: { [key: string]: number } = {};
    const sortedTransactions = [...currentTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    sortedTransactions.forEach(transaction => {
      if (transaction.category !== 'Transfer') {
        runningBalance += transaction.amount;
      }
      const date = new Date(transaction.date);
      const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      data[yearMonth] = runningBalance;
    });
    return data;
  }, [currentTransactions]);

  const expensesChange = useMemo(() => calculatePercentageChange(monthlyExpensesData), [monthlyExpensesData]);
  const incomeChange = useMemo(() => calculatePercentageChange(monthlyIncomeData), [monthlyIncomeData]);
  const balanceChange = useMemo(() => calculatePercentageChange(monthlyBalanceData, true), [monthlyBalanceData]);

  const getChangeColorClass = (isPositive: boolean | null, type: 'income' | 'expenses' | 'balance') => {
    if (isPositive === null) return "text-muted-foreground";
    if (type === 'expenses') {
      return isPositive ? "text-red-500" : "text-green-500";
    }
    return isPositive ? "text-green-500" : "text-red-500";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
          <p className={cn("text-xs", getChangeColorClass(balanceChange.isPositive, 'balance'))}>
            {balanceChange.value} from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
          <p className={cn("text-xs", getChangeColorClass(incomeChange.isPositive, 'income'))}>
            {incomeChange.value} from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          <p className={cn("text-xs", getChangeColorClass(expensesChange.isPositive, 'expenses'))}>
            {expensesChange.value} from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{numberOfActiveAccounts}</div>
          <p className="text-xs text-muted-foreground">Unique accounts with transactions</p>
        </CardContent>
      </Card>
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Income vs. Expenses</CardTitle>
            <CardDescription>Monthly overview of your financial activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <BarChart data={monthlySummary}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={32}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" formatter={(value) => formatCurrency(Number(value))} />}
                />
                <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <SpendingCategoriesChart transactions={filteredTransactions} />
      </div>
      <div className="lg:col-span-1">
        <SpendingByVendorChart transactions={filteredTransactions} />
      </div>
    </div>
  );
};

export default Index;