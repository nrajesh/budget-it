"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Area, AreaChart, BarChart, Bar, Cell } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDateToDDMMYYYY } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface BalanceOverTimeChartProps {
  transactions: Transaction[];
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

type ChartType = 'line' | 'area-unstacked' | 'area-stacked' | 'bar-stacked';

export function BalanceOverTimeChart({ transactions }: BalanceOverTimeChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const [allDefinedAccounts, setAllDefinedAccounts] = React.useState<string[]>([]);
  const [activeLine, setActiveLine] = React.useState<string | null>(null);
  const [activeBar, setActiveBar] = React.useState<{ monthIndex: number; dataKey: string } | null>(null);
  const [chartType, setChartType] = React.useState<ChartType>('line');

  React.useEffect(() => {
    const fetchAccountNames = async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('name')
        .eq('is_account', true);

      if (error) {
        console.error("Error fetching account names for chart:", error.message);
        setAllDefinedAccounts([]);
      } else {
        setAllDefinedAccounts(data.map(item => item.name));
      }
    };
    fetchAccountNames();
  }, []);

  const accountsToDisplay = React.useMemo(() => {
    const uniqueAccounts = new Set<string>();
    transactions.forEach(t => uniqueAccounts.add(t.account));
    return Array.from(uniqueAccounts);
  }, [transactions]);

  // Data for Line and Area Charts (daily running balances)
  const dailyChartData = React.useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dailyBalances: { [date: string]: { [account: string]: number } } = {};

    const initialBalances: { [account: string]: number } = {};
    allDefinedAccounts.forEach(account => {
      initialBalances[account] = 0;
    });
    dailyBalances['initial'] = initialBalances;

    sortedTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!dailyBalances[date]) {
        const previousDate = Object.keys(dailyBalances).sort().pop();
        dailyBalances[date] = previousDate ? { ...dailyBalances[previousDate] } : { ...dailyBalances['initial'] };
      }

      if (dailyBalances[date][transaction.account] !== undefined) {
        const convertedAmount = convertBetweenCurrencies(transaction.amount, transaction.currency, selectedCurrency);
        dailyBalances[date][transaction.account] += convertedAmount;
      }
    });

    const formattedData = Object.entries(dailyBalances)
      .filter(([date]) => date !== 'initial')
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, balances]) => {
        const obj: { date: string; [key: string]: number | string } = { date: formatDateToDDMMYYYY(date) };
        accountsToDisplay.forEach(account => {
          obj[account] = balances[account] || 0;
        });
        return obj;
      });

    return formattedData;
  }, [transactions, selectedCurrency, convertBetweenCurrencies, accountsToDisplay, allDefinedAccounts]);

  // Data for Stacked Bar Chart (monthly ending balances)
  const monthlyStackedBarChartData = React.useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const monthlyData: { [monthKey: string]: { [account: string]: number } } = {};
    let currentRunningBalances: { [account: string]: number } = {};

    allDefinedAccounts.forEach(account => {
      currentRunningBalances[account] = 0;
    });

    sortedTransactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const monthKey = `${transactionDate.getFullYear()}-${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}`;

      const convertedAmount = convertBetweenCurrencies(transaction.amount, transaction.currency, selectedCurrency);
      if (currentRunningBalances[transaction.account] !== undefined) {
        currentRunningBalances[transaction.account] += convertedAmount;
      } else {
        currentRunningBalances[transaction.account] = convertedAmount;
      }

      monthlyData[monthKey] = { ...currentRunningBalances };
    });

    const allMonths: string[] = [];
    if (sortedTransactions.length > 0) {
      const firstDate = new Date(sortedTransactions[0].date);
      const lastDate = new Date(sortedTransactions[sortedTransactions.length - 1].date);

      let currentDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
      while (currentDate <= lastDate) {
        allMonths.push(`${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    const finalMonthlyData: { month: string; [key: string]: number | string }[] = [];
    let lastMonthBalances: { [account: string]: number } = {};
    allDefinedAccounts.forEach(account => lastMonthBalances[account] = 0);

    allMonths.forEach(monthKey => {
      if (monthlyData[monthKey]) {
        lastMonthBalances = { ...monthlyData[monthKey] };
      }
      const obj: { month: string; [key: string]: number | string } = { month: monthKey };
      accountsToDisplay.forEach(account => {
        obj[account] = lastMonthBalances[account] || 0;
      });
      finalMonthlyData.push(obj);
    });

    return finalMonthlyData;
  }, [transactions, selectedCurrency, convertBetweenCurrencies, accountsToDisplay, allDefinedAccounts]);


  const totalBalance = React.useMemo(() => {
    const dataToUse = chartType === 'bar-stacked' ? monthlyStackedBarChartData : dailyChartData;
    if (dataToUse.length === 0) return 0;
    const lastDayBalances = dataToUse[dataToUse.length - 1];
    return accountsToDisplay.reduce((sum, account) => {
      const balance = lastDayBalances[account];
      return sum + (typeof balance === 'number' ? balance : 0);
    }, 0);
  }, [dailyChartData, monthlyStackedBarChartData, accountsToDisplay, chartType]);

  const dynamicChartConfig = React.useMemo(() => {
    const newConfig = { ...chartConfig };
    allDefinedAccounts.forEach((account, index) => {
      const colorIndex = (index % 4) + 1;
      newConfig[account as keyof typeof newConfig] = {
        label: account,
        color: `hsl(var(--chart-${colorIndex}))`,
      };
    });
    return newConfig;
  }, [allDefinedAccounts]);

  // Handler for clicking a line/area
  const handleLineClick = React.useCallback((dataKey: string) => {
    setActiveLine(prevActiveLine => (prevActiveLine === dataKey ? null : dataKey));
  }, []);

  // Handler for clicking a bar
  const handleBarClick = React.useCallback((data: any, monthIndex: number, clickedDataKey: string) => {
    setActiveBar(prevActiveBar => {
      if (prevActiveBar?.monthIndex === monthIndex && prevActiveBar?.dataKey === clickedDataKey) {
        return null;
      } else {
        return { monthIndex, dataKey: clickedDataKey };
      }
    });
  }, []);

  const renderChart = () => {
    const dataToUse = chartType === 'bar-stacked' ? monthlyStackedBarChartData : dailyChartData;
    const xAxisDataKey = chartType === 'bar-stacked' ? 'month' : 'date';

    if (dataToUse.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No transaction data available to display.</p>;
    }

    const commonChartProps = {
      accessibilityLayer: true,
      data: dataToUse,
      margin: { left: 12, right: 12 },
      className: "aspect-auto h-[250px] w-full",
    };

    const commonAxisProps = {
      tickLine: false,
      axisLine: false,
      tickMargin: 8,
      minTickGap: 32,
    };

    const commonTooltip = (
      <ChartTooltip
        cursor={false}
        content={
          <ChartTooltipContent
            indicator="dashed"
            formatter={(value, name) => `${name}: ${formatCurrency(Number(value))}`}
          />
        }
      />
    );

    let ChartComponent: React.ElementType; // Declare ChartComponent here
    let ItemComponent: React.ElementType; // Declare ItemComponent here

    switch (chartType) {
      case 'line':
      case 'area-unstacked':
      case 'area-stacked':
        ChartComponent = chartType === 'line' ? LineChart : AreaChart; // Assign here
        ItemComponent = chartType === 'line' ? Line : Area;
        const stackId = chartType === 'area-stacked' ? "a" : undefined;

        return (
          <ChartComponent {...commonChartProps}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisDataKey}
              {...commonAxisProps}
              tickFormatter={(value) => value}
            />
            <YAxis
              {...commonAxisProps}
              tickFormatter={(value) => formatCurrency(Number(value))}
            />
            {commonTooltip}
            {accountsToDisplay.map(account => (
              <ItemComponent
                key={account}
                dataKey={account}
                type="monotone"
                stackId={stackId}
                stroke={
                  activeLine === null
                    ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                    : (activeLine === account
                      ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                      : '#ccc')
                }
                fill={
                  chartType !== 'line'
                    ? (activeLine === null
                      ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                      : (activeLine === account
                        ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                        : '#ccc'))
                    : undefined
                }
                strokeWidth={2}
                dot={false}
                onClick={() => handleLineClick(account)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </ChartComponent>
        );

      case 'bar-stacked':
        return (
          <BarChart {...commonChartProps}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisDataKey}
              {...commonAxisProps}
              tickFormatter={(value) => value.slice(0, 7)}
            />
            <YAxis
              {...commonAxisProps}
              tickFormatter={(value) => formatCurrency(Number(value))}
            />
            {commonTooltip}
            {accountsToDisplay.map(account => (
              <Bar
                key={account}
                dataKey={account}
                stackId="a"
                radius={4}
                onClick={(data, monthIndex) => handleBarClick(data, monthIndex, account)}
              >
                {dataToUse.map((entry, monthIndex) => (
                  <Cell
                    key={`bar-cell-${account}-${monthIndex}`}
                    fill={
                      activeBar === null
                        ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                        : (activeBar.monthIndex === monthIndex && activeBar.dataKey === account
                          ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                          : '#ccc')
                    }
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center p-6">
          <CardTitle>Balance Over Time</CardTitle>
          <CardDescription>
            Total balance: {formatCurrency(totalBalance)}
          </CardDescription>
        </div>
        <div className="flex items-center gap-1 p-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                {chartType === 'line' && 'Line Chart'}
                {chartType === 'area-unstacked' && 'Area Chart (Unstacked)'}
                {chartType === 'area-stacked' && 'Area Chart (Stacked)'}
                {chartType === 'bar-stacked' && 'Stacked Bar Chart'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => setChartType('line')}>
                Line Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType('area-unstacked')}>
                Area Chart (Unstacked)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType('area-stacked')}>
                Area Chart (Stacked)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType('bar-stacked')}>
                Stacked Bar Chart
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={dynamicChartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}