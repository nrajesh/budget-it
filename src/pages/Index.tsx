import { useMemo, useState, useCallback } from "react"; // Import useCallback
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"; // Import Cell
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { SpendingByVendorChart } from "@/components/SpendingByVendorChart";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn, slugify } from "@/lib/utils";
import { BudgetVsConsumptionChart } from "@/components/budgets/BudgetVsConsumptionChart";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { SmartSearchInput } from "@/components/SmartSearchInput";
import { ActiveFiltersDisplay } from "@/components/ActiveFiltersDisplay";

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

import { FinancialPulseDashboard } from "@/components/dashboard/FinancialPulseDashboard";
import { useTheme } from "@/contexts/ThemeContext";

const Index = () => {
  const { transactions } = useTransactions();
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const { dashboardStyle } = useTheme();

  const {
    selectedAccounts,
    selectedCategories,
    excludeTransfers,
    dateRange
  } = useTransactionFilters();

  if (dashboardStyle === 'financial-pulse') {
    return <FinancialPulseDashboard />;
  }

  // State to track the active bar in the Income vs. Expenses chart
  const [activeBar, setActiveBar] = useState<{ monthIndex: number; dataKey: 'income' | 'expenses' } | null>(null);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by Date Range
    if (dateRange?.from) {
      filtered = filtered.filter(t => new Date(t.date) >= dateRange.from!);
    }
    if (dateRange?.to) {
      filtered = filtered.filter(t => new Date(t.date) <= dateRange.to!);
    }

    if (excludeTransfers) {
      filtered = filtered.filter(t => t.category !== 'Transfer');
    }

    if (selectedAccounts.length > 0) {
      filtered = filtered.filter(t => selectedAccounts.includes(slugify(t.account)));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(slugify(t.category)));
    }

    return filtered;
  }, [transactions, selectedAccounts, selectedCategories, excludeTransfers, dateRange]);

  const monthlySummary = useMemo(() => {
    const summary: { [key: string]: { income: number; expenses: number } } = {};

    filteredTransactions.forEach(transaction => {
      // Transfer exclusion is already handled in filteredTransactions, but kept for double safety if logic changes
      if (excludeTransfers && transaction.category === 'Transfer') return;

      const month = new Date(transaction.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!summary[month]) {
        summary[month] = { income: 0, expenses: 0 };
      }

      const convertedAmount = convertBetweenCurrencies(transaction.amount, transaction.currency || 'USD', selectedCurrency || 'USD');

      if (transaction.amount > 0 && (transaction.category !== 'Transfer' || !excludeTransfers)) {
        summary[month].income += convertedAmount;
      } else if (transaction.amount < 0 && (transaction.category !== 'Transfer' || !excludeTransfers)) {
        summary[month].expenses += Math.abs(convertedAmount);
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
      income: summary[month].income,
      expenses: summary[month].expenses,
    }));
  }, [filteredTransactions, selectedCurrency, convertBetweenCurrencies, excludeTransfers]);

  const totalBalance = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (excludeTransfers && t.category === 'Transfer') return acc;
      return acc + convertBetweenCurrencies(t.amount, t.currency || 'USD', selectedCurrency || 'USD');
    }, 0);
  }, [filteredTransactions, selectedCurrency, convertBetweenCurrencies, excludeTransfers]);

  const totalIncome = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (excludeTransfers && t.category === 'Transfer') return acc;
      if (t.amount > 0) {
        return acc + convertBetweenCurrencies(t.amount, t.currency || 'USD', selectedCurrency || 'USD');
      }
      return acc;
    }, 0);
  }, [filteredTransactions, selectedCurrency, convertBetweenCurrencies, excludeTransfers]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (excludeTransfers && t.category === 'Transfer') return acc;
      if (t.amount < 0) {
        return acc + Math.abs(convertBetweenCurrencies(t.amount, t.currency || 'USD', selectedCurrency || 'USD'));
      }
      return acc;
    }, 0);
  }, [filteredTransactions, selectedCurrency, convertBetweenCurrencies, excludeTransfers]);

  const calculatePercentageChange = (
    data: { [key: string]: number }
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
    filteredTransactions.forEach(transaction => {
      if (excludeTransfers && transaction.category === 'Transfer') return;
      if (transaction.amount < 0) {
        const date = new Date(transaction.date);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        data[yearMonth] = (data[yearMonth] || 0) + Math.abs(convertBetweenCurrencies(transaction.amount, transaction.currency || 'USD', selectedCurrency || 'USD'));
      }
    });
    return data;
  }, [filteredTransactions, selectedCurrency, convertBetweenCurrencies, excludeTransfers]);

  const monthlyIncomeData = useMemo(() => {
    const data: { [key: string]: number } = {};
    filteredTransactions.forEach(transaction => {
      if (excludeTransfers && transaction.category === 'Transfer') return;
      if (transaction.amount > 0) {
        const date = new Date(transaction.date);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        data[yearMonth] = (data[yearMonth] || 0) + convertBetweenCurrencies(transaction.amount, transaction.currency || 'USD', selectedCurrency || 'USD');
      }
    });
    return data;
  }, [filteredTransactions, selectedCurrency, convertBetweenCurrencies, excludeTransfers]);

  const monthlyBalanceData = useMemo(() => {
    const data: { [key: string]: number } = {};
    const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    sortedTransactions.forEach(transaction => {
      if (excludeTransfers && transaction.category === 'Transfer') return;
      runningBalance += convertBetweenCurrencies(transaction.amount, transaction.currency || 'USD', selectedCurrency || 'USD');
      const date = new Date(transaction.date);
      const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      data[yearMonth] = runningBalance;
    });
    return data;
  }, [filteredTransactions, selectedCurrency, convertBetweenCurrencies, excludeTransfers]);

  const expensesChange = useMemo(() => calculatePercentageChange(monthlyExpensesData), [monthlyExpensesData]);
  const incomeChange = useMemo(() => calculatePercentageChange(monthlyIncomeData), [monthlyIncomeData]);
  const balanceChange = useMemo(() => calculatePercentageChange(monthlyBalanceData), [monthlyBalanceData]);


  const getChangeColorClass = (isPositive: boolean | null, type: 'income' | 'expenses' | 'balance') => {
    if (isPositive === null) return "text-muted-foreground";
    if (type === 'expenses') {
      return isPositive ? "text-red-500" : "text-green-500";
    }
    return isPositive ? "text-green-500" : "text-red-500";
  };
  // Handler for clicking a bar in the Income vs. Expenses chart
  const handleBarClick = useCallback((_data: any, monthIndex: number, clickedDataKey: 'income' | 'expenses') => {
    setActiveBar(prevActiveBar => {
      if (prevActiveBar?.monthIndex === monthIndex && prevActiveBar?.dataKey === clickedDataKey) {
        // Clicking the same bar again, reset
        return null;
      } else {
        // Clicking a new bar
        return { monthIndex, dataKey: clickedDataKey };
      }
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your financial health</p>
        </div>

        {/* Smart Search */}
        <div className="flex flex-col gap-2">
          <SmartSearchInput />
          <ActiveFiltersDisplay />
        </div>


      </div>

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
        <div className="lg:col-span-1">
          <BudgetVsConsumptionChart />
        </div>
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Income vs. Expenses</CardTitle>
              <CardDescription>Monthly overview.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
                <BarChart data={monthlySummary} layout="vertical" margin={{ left: 0, right: 0 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => formatCurrency(Number(value))}
                  />
                  <YAxis
                    dataKey="month"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    width={50}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" formatter={(value) => formatCurrency(Number(value))} />}
                  />
                  <Bar
                    dataKey="income"
                    radius={4}
                    onClick={(data, monthIndex) => handleBarClick(data, monthIndex, 'income')}
                  >
                    {monthlySummary.map((_entry, monthIndex) => (
                      <Cell
                        key={`income-cell-${monthIndex}`}
                        fill={
                          activeBar === null
                            ? chartConfig.income.color
                            : (activeBar.monthIndex === monthIndex && activeBar.dataKey === 'income'
                              ? chartConfig.income.color
                              : '#ccc')
                        }
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="expenses"
                    radius={4}
                    onClick={(data, monthIndex) => handleBarClick(data, monthIndex, 'expenses')}
                  >
                    {monthlySummary.map((_entry, monthIndex) => (
                      <Cell
                        key={`expenses-cell-${monthIndex}`}
                        fill={
                          activeBar === null
                            ? chartConfig.expenses.color
                            : (activeBar.monthIndex === monthIndex && activeBar.dataKey === 'expenses'
                              ? chartConfig.expenses.color
                              : '#ccc')
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3 grid gap-4 grid-cols-1 md:grid-cols-2">
          <SpendingCategoriesChart transactions={filteredTransactions} />
          <SpendingByVendorChart transactions={filteredTransactions} />
        </div>
      </div>
    </div>
  );
};

export default Index;