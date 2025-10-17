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
import { ChevronDown, X } from "lucide-react"; // Added X icon for reset button
import { DateRange } from "react-day-picker"; // Added DateRange type
import { DateRangePicker } from "./DateRangePicker"; // New import for date range picker

interface BalanceOverTimeChartProps {
  transactions: Transaction[];
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

type ChartType = 'line' | 'bar-stacked' | 'waterfall'; // Reverted ChartType to original

export function BalanceOverTimeChart({ transactions }: BalanceOverTimeChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const [allDefinedAccounts, setAllDefinedAccounts] = React.useState<string[]>([]);
  const [accountStartingBalances, setAccountStartingBalances] = React.useState<Record<string, { balance: number; currency: string }>>({});
  const [activeLine, setActiveLine] = React.useState<string | null>(null);
  const [activeBar, setActiveBar] = React.useState<{ monthIndex: number; dataKey: string } | null>(null);
  const [chartType, setChartType] = React.useState<ChartType>('line');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined); // New state for date range

  React.useEffect(() => {
    const fetchAccountData = async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('name, account_id, accounts(currency, starting_balance)')
        .eq('is_account', true);

      if (error) {
        console.error("Error fetching account names and balances for chart:", error.message);
        setAllDefinedAccounts([]);
        setAccountStartingBalances({});
      } else {
        const names = data.map(item => item.name);
        setAllDefinedAccounts(names);

        const balances: Record<string, { balance: number; currency: string }> = {};
        data.forEach(item => {
          // Supabase returns related data as an array, even for one-to-one relationships
          const accountDetails = item.accounts && item.accounts.length > 0 ? item.accounts[0] : null;
          if (accountDetails) {
            balances[item.name] = {
              balance: accountDetails.starting_balance || 0,
              currency: accountDetails.currency || selectedCurrency,
            };
          } else {
            balances[item.name] = {
              balance: 0,
              currency: selectedCurrency,
            };
          }
        });
        setAccountStartingBalances(balances);
      }
    };
    fetchAccountData();
  }, [selectedCurrency]);

  const accountsToDisplay = React.useMemo(() => {
    const uniqueAccounts = new Set<string>();
    transactions.forEach(t => uniqueAccounts.add(t.account));
    return Array.from(uniqueAccounts);
  }, [transactions]);

  const dailyRunningBalanceData = React.useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dailyBalances: { [date: string]: { [account: string]: number } } = {};

    const initialBalances: { [account: string]: number } = {};
    accountsToDisplay.forEach(account => {
      const startingBalanceInfo = accountStartingBalances[account];
      const initialAmount = startingBalanceInfo
        ? convertBetweenCurrencies(startingBalanceInfo.balance, startingBalanceInfo.currency, selectedCurrency)
        : 0;
      initialBalances[account] = initialAmount;
    });
    dailyBalances['initial'] = initialBalances;

    sortedTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!dailyBalances[date]) {
        const previousDate = Object.keys(dailyBalances).sort().pop();
        dailyBalances[date] = previousDate ? { ...dailyBalances[previousDate] } : { ...dailyBalances['initial'] };
      }

      if (dailyBalances[date][transaction.account] === undefined) {
        dailyBalances[date][transaction.account] = 0;
      }
      
      const convertedAmount = convertBetweenCurrencies(transaction.amount, transaction.currency, selectedCurrency);
      dailyBalances[date][transaction.account] += convertedAmount;
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
  }, [transactions, selectedCurrency, convertBetweenCurrencies, accountsToDisplay, accountStartingBalances]);

  const monthlyStackedBarChartData = React.useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const monthlyData: { [monthKey: string]: { [account: string]: number } } = {};
    let currentRunningBalances: { [account: string]: number } = {};

    accountsToDisplay.forEach(account => {
      const startingBalanceInfo = accountStartingBalances[account];
      const initialAmount = startingBalanceInfo
        ? convertBetweenCurrencies(startingBalanceInfo.balance, startingBalanceInfo.currency, selectedCurrency)
        : 0;
      currentRunningBalances[account] = initialAmount;
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
    accountsToDisplay.forEach(account => {
      const startingBalanceInfo = accountStartingBalances[account];
      const initialAmount = startingBalanceInfo
        ? convertBetweenCurrencies(startingBalanceInfo.balance, startingBalanceInfo.currency, selectedCurrency)
        : 0;
      lastMonthBalances[account] = initialAmount;
    });

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
  }, [transactions, selectedCurrency, convertBetweenCurrencies, accountsToDisplay, accountStartingBalances]);

  const dailyNetChangeData = React.useMemo(() => {
    const data = dailyRunningBalanceData;
    if (data.length === 0) return [];

    const netChanges: { date: string; totalChange: number; [key: string]: number | string }[] = [];
    let previousDayBalances: { [account: string]: number } = {};

    if (data.length > 0) {
      accountsToDisplay.forEach(account => {
        previousDayBalances[account] = (data[0][account] as number) || 0;
      });
    }

    data.forEach((currentDay, index) => {
      if (index === 0) {
        const firstDayChange: { date: string; totalChange: number; [key: string]: number | string } = {
          date: currentDay.date,
          totalChange: 0,
        };
        let dayTotalChange = 0;
        accountsToDisplay.forEach(account => {
          const change = (currentDay[account] as number) || 0;
          firstDayChange[account] = change;
          dayTotalChange += change;
        });
        firstDayChange.totalChange = dayTotalChange;
        netChanges.push(firstDayChange);
      } else {
        const dayChange: { date: string; totalChange: number; [key: string]: number | string } = {
          date: currentDay.date,
          totalChange: 0,
        };
        let dayTotalChange = 0;
        accountsToDisplay.forEach(account => {
          const currentBalance = (currentDay[account] as number) || 0;
          const prevBalance = previousDayBalances[account] || 0;
          const change = currentBalance - prevBalance;
          dayChange[account] = change;
          dayTotalChange += change;
        });
        dayChange.totalChange = dayTotalChange;
        netChanges.push(dayChange);
      }

      accountsToDisplay.forEach(account => {
        previousDayBalances[account] = (currentDay[account] as number) || 0;
      });
    });

    return netChanges;
  }, [dailyRunningBalanceData, accountsToDisplay]);


  const totalBalance = React.useMemo(() => {
    let dataForTotalCalculation;
    if (chartType === 'bar-stacked') {
      dataForTotalCalculation = monthlyStackedBarChartData;
    } else { // line or waterfall
      dataForTotalCalculation = dailyRunningBalanceData;
    }

    let filteredDataForTotal = dataForTotalCalculation;
    if (dateRange?.from && dateRange?.to) {
      filteredDataForTotal = dataForTotalCalculation.filter((item: any) => {
        let itemDate: Date;
        if (chartType === 'bar-stacked') {
          const [year, month] = item.month.split('-').map(Number);
          itemDate = new Date(year, month - 1, 1);
        } else { // line or waterfall
          const parts = item.date.split('/');
          itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        
        // Create new Date objects for comparison to avoid mutating state
        const compareFromDate = new Date(dateRange.from!);
        const compareToDate = new Date(dateRange.to!);

        // Set hours for comparison to be inclusive of the entire day
        compareFromDate.setHours(0, 0, 0, 0);
        compareToDate.setHours(23, 59, 59, 999);

        return itemDate >= compareFromDate && itemDate <= compareToDate;
      });
    }

    if (filteredDataForTotal.length === 0) return 0;

    const lastDataPoint = filteredDataForTotal[filteredDataForTotal.length - 1];
    return accountsToDisplay.reduce((sum, account) => {
      const balance = lastDataPoint[account];
      return sum + (typeof balance === 'number' ? balance : 0);
    }, 0);
  }, [dailyRunningBalanceData, monthlyStackedBarChartData, accountsToDisplay, chartType, dateRange]);

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

  const handleLineClick = React.useCallback((dataKey: string) => {
    setActiveLine(prevActiveLine => (prevActiveLine === dataKey ? null : dataKey));
  }, []);

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
    let rawDataToUse;
    let xAxisDataKey;

    if (chartType === 'bar-stacked') {
      rawDataToUse = monthlyStackedBarChartData;
      xAxisDataKey = 'month';
    } else if (chartType === 'waterfall') {
      rawDataToUse = dailyNetChangeData;
      xAxisDataKey = 'date';
    } else { // line chart
      rawDataToUse = dailyRunningBalanceData;
      xAxisDataKey = 'date';
    }

    let filteredDataToUse = rawDataToUse;

    if (dateRange?.from && dateRange?.to) {
      filteredDataToUse = rawDataToUse.filter((item: any) => {
        let itemDate: Date;
        if (xAxisDataKey === 'month') {
          const [year, month] = item.month.split('-').map(Number);
          itemDate = new Date(year, month - 1, 1); // First day of the month
        } else { // 'date' format DD/MM/YYYY
          const parts = item.date.split('/');
          itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        
        // Create new Date objects for comparison to avoid mutating state
        const compareFromDate = new Date(dateRange.from!);
        const compareToDate = new Date(dateRange.to!);

        // Set hours for comparison to be inclusive of the entire day
        compareFromDate.setHours(0, 0, 0, 0); // Set to start of day
        compareToDate.setHours(23, 59, 59, 999); // Set to end of day

        return itemDate >= compareFromDate && itemDate <= compareToDate;
      });
    }

    if (filteredDataToUse.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No transaction data available for the selected date range.</p>;
    }

    const commonChartProps = {
      accessibilityLayer: true,
      data: filteredDataToUse, // Use filtered data here
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

    let ChartComponent: React.ElementType;
    let ItemComponent: React.ElementType;

    switch (chartType) {
      case 'line':
        ChartComponent = LineChart;
        ItemComponent = Line;

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
                stroke={
                  activeLine === null
                    ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                    : (activeLine === account
                      ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                      : '#ccc')
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
                {filteredDataToUse.map((entry, monthIndex) => (
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

      case 'waterfall':
        return (
          <BarChart {...commonChartProps}>
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
              <Bar
                key={account}
                dataKey={account}
                stackId="a"
                radius={4}
                onClick={(data, monthIndex) => handleBarClick(data, monthIndex, account)}
              >
                {filteredDataToUse.map((entry, index) => {
                  const value = entry[account] as number;
                  const color = value >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))';
                  return (
                    <Cell
                      key={`waterfall-cell-${account}-${index}`}
                      fill={
                        activeBar === null
                          ? color
                          : (activeBar.monthIndex === index && activeBar.dataKey === account
                            ? color
                            : '#ccc')
                      }
                    />
                  );
                })}
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
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          {(dateRange?.from || dateRange?.to) && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDateRange(undefined)}
              className="ml-2"
              aria-label="Reset zoom"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                {chartType === 'line' && 'Line Chart'}
                {chartType === 'bar-stacked' && 'Stacked Bar Chart'}
                {chartType === 'waterfall' && 'Waterfall Chart'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => setChartType('line')}>
                Line Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType('bar-stacked')}>
                Stacked Bar Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType('waterfall')}>
                Waterfall Chart
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