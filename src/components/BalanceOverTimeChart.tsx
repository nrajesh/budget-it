"use client";

import * as React from "react";
import { ThemedCard, ThemedCardContent, ThemedCardDescription, ThemedCardHeader, ThemedCardTitle } from "@/components/ThemedCard";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, XAxis, YAxis, BarChart, Bar, Cell, Area, ComposedChart } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDateToDDMMYYYY, slugify } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

import { DateRange } from "react-day-picker";

interface BalanceOverTimeChartProps {
  transactions: Transaction[];
  projectedTransactions?: Transaction[];
  dateRange?: DateRange;
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

type ChartType = 'line' | 'bar-stacked' | 'waterfall';

export function BalanceOverTimeChart({ transactions, projectedTransactions = [], dateRange }: BalanceOverTimeChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const { isFinancialPulse } = useTheme();
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
    projectedTransactions.forEach(t => uniqueAccounts.add(t.account));
    return Array.from(uniqueAccounts);
  }, [transactions, projectedTransactions]);

  // Data for Line and Area Charts (daily running balances)
  const dailyRunningBalanceData = React.useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const initialBalances: { [account: string]: number } = {};

    allDefinedAccounts.forEach(account => {
      initialBalances[account] = 0;
    });

    // We don't have historical data prior to the filtered range, so we start at 0 or the first transaction's value.
    // Ideally we would want the OPENING balance for the selected period, but that requires more data.
    // For now, we will just track changes within the visible set.

    // HOWEVER, to support proper date ranges, we must iterate through EVERY DAY in the range.

    let startDate: Date;
    let endDate: Date;

    if (dateRange?.from && dateRange?.to) {
      startDate = new Date(dateRange.from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(dateRange.to);
      endDate.setHours(0, 0, 0, 0);
    } else if (sortedTransactions.length > 0) {
      startDate = new Date(sortedTransactions[0].date);
      endDate = new Date(sortedTransactions[sortedTransactions.length - 1].date);
    } else {
      return [];
    }

    // Initialize daily balances map with zero for the start
    // If we rely on 'initial', we need to be careful.
    // Let's just build a map of date -> balances.

    const transactionMap: { [date: string]: Transaction[] } = {};
    sortedTransactions.forEach(t => {
      const d = new Date(t.date).toISOString().split('T')[0];
      if (!transactionMap[d]) transactionMap[d] = [];
      transactionMap[d].push(t);
    });

    const result = [];
    let currentBalances = { ...initialBalances };

    // Improve: If we have transactions BEFORE startDate in the sorted list (shouldn't happen if filtered correctly upstream),
    // we should process them to get the "opening balance". 
    // But currently 'transactions' passed in are already filtered by date in Analytics.tsx. 
    // So visual balance starts at 0 + daily changes.
    // NOTE: This means the chart shows "change in balance over period", not absolute balance, unless 
    // we fetch opening balance. This is an existing limitation we are preserving, just fixing the X-axis range.

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Use local time to construct YYYY-MM-DD to avoid UTC timezone shifts causing off-by-one errors
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Apply transactions for this day
      const daysTransactions = transactionMap[dateStr] || [];
      daysTransactions.forEach(t => {
        if (currentBalances[t.account] !== undefined) {
          const convertedAmount = convertBetweenCurrencies(t.amount, t.currency, selectedCurrency);
          currentBalances[t.account] += convertedAmount;
        } else {
          // Initialize if not in initial list (e.g. account not in allDefinedAccounts yet)
          const convertedAmount = convertBetweenCurrencies(t.amount, t.currency, selectedCurrency);
          currentBalances[t.account] = convertedAmount;
        }
      });

      // Store snapshot
      const obj: { date: string;[key: string]: number | string } = { date: formatDateToDDMMYYYY(dateStr) };
      accountsToDisplay.forEach(account => {
        obj[account] = currentBalances[account] || 0;
      });
      result.push(obj);

      // Next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }, [transactions, selectedCurrency, convertBetweenCurrencies, accountsToDisplay, allDefinedAccounts, dateRange]);

  // Data for Projected Line Chart
  const projectedDailyRunningBalanceData = React.useMemo(() => {
    if (!projectedTransactions || projectedTransactions.length === 0) return [];

    const lastActualDataPoint = dailyRunningBalanceData[dailyRunningBalanceData.length - 1];
    if (!lastActualDataPoint) return [];

    const startingBalances: { [account: string]: number } = {};
    accountsToDisplay.forEach(account => {
      startingBalances[account] = (lastActualDataPoint[account] as number) || 0;
    });

    const sortedProjectedTransactions = [...projectedTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dailyBalances: { [date: string]: { [account: string]: number } } = {};
    dailyBalances['start_projection'] = startingBalances;

    sortedProjectedTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!dailyBalances[date]) {
        const previousDates = Object.keys(dailyBalances).sort();
        const lastDate = previousDates[previousDates.length - 1];
        dailyBalances[date] = { ...dailyBalances[lastDate] };
      }

      if (dailyBalances[date][transaction.account] !== undefined) {
        const convertedAmount = convertBetweenCurrencies(transaction.amount, transaction.currency, selectedCurrency);
        dailyBalances[date][transaction.account] += convertedAmount;
      }
    });

    const formattedData = Object.entries(dailyBalances)
      .filter(([date]) => date !== 'start_projection')
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, balances]) => {
        const obj: { date: string;[key: string]: number | string } = { date: formatDateToDDMMYYYY(date) };
        accountsToDisplay.forEach(account => {
          obj[`${account}_projected`] = balances[account] || 0;
        });
        return obj;
      });

    return formattedData;
  }, [projectedTransactions, dailyRunningBalanceData, accountsToDisplay, convertBetweenCurrencies, selectedCurrency]);

  // Combined data for Line Chart specifically
  const combinedLineChartData = React.useMemo(() => {
    if (chartType !== 'line') return dailyRunningBalanceData;

    if (dailyRunningBalanceData.length === 0) return [];

    const lastActual = dailyRunningBalanceData[dailyRunningBalanceData.length - 1];

    const bridgePoint = { ...lastActual };
    accountsToDisplay.forEach(account => {
      bridgePoint[`${account}_projected`] = lastActual[account];
    });

    return [...dailyRunningBalanceData, bridgePoint, ...projectedDailyRunningBalanceData];
  }, [dailyRunningBalanceData, projectedDailyRunningBalanceData, chartType, accountsToDisplay]);

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

    const finalMonthlyData: { month: string;[key: string]: number | string }[] = [];
    let lastMonthBalances: { [account: string]: number } = {};
    allDefinedAccounts.forEach(account => lastMonthBalances[account] = 0);

    allMonths.forEach(monthKey => {
      if (monthlyData[monthKey]) {
        lastMonthBalances = { ...monthlyData[monthKey] };
      }
      const obj: { month: string;[key: string]: number | string } = { month: monthKey };
      accountsToDisplay.forEach(account => {
        obj[account] = lastMonthBalances[account] || 0;
      });
      finalMonthlyData.push(obj);
    });

    return finalMonthlyData;
  }, [transactions, selectedCurrency, convertBetweenCurrencies, accountsToDisplay, allDefinedAccounts]);

  // Data for Waterfall Chart (daily net changes)
  const dailyNetChangeData = React.useMemo(() => {
    const data = dailyRunningBalanceData;
    if (data.length === 0) return [];

    const netChanges: { date: string; totalChange: number;[key: string]: number | string }[] = [];
    let previousDayBalances: { [account: string]: number } = {};

    if (data.length > 0) {
      accountsToDisplay.forEach(account => {
        previousDayBalances[account] = (data[0][account] as number) || 0;
      });
    }

    data.forEach((currentDay, index) => {
      if (index === 0) {
        const firstDayChange: { date: string; totalChange: number;[key: string]: number | string } = {
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
        const dayChange: { date: string; totalChange: number;[key: string]: number | string } = {
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
    let dataToUse;
    if (chartType === 'bar-stacked') {
      dataToUse = monthlyStackedBarChartData;
    } else if (chartType === 'waterfall') {
      dataToUse = dailyNetChangeData;
    } else {
      dataToUse = dailyRunningBalanceData;
    }

    if (dataToUse.length === 0) return 0;
    const lastDayBalances = dataToUse[dataToUse.length - 1];
    return accountsToDisplay.reduce((sum, account) => {
      const balance = lastDayBalances[account];
      return sum + (typeof balance === 'number' ? balance : 0);
    }, 0);
  }, [dailyRunningBalanceData, monthlyStackedBarChartData, accountsToDisplay, chartType]);

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

  const handleBarClick = React.useCallback((_data: any, monthIndex: number, clickedDataKey: string) => {
    setActiveBar(prevActiveBar => {
      if (prevActiveBar?.monthIndex === monthIndex && prevActiveBar?.dataKey === clickedDataKey) {
        return null;
      } else {
        return { monthIndex, dataKey: clickedDataKey };
      }
    });
  }, []);

  const renderChart = () => {
    let dataToUse;
    let xAxisDataKey;

    if (chartType === 'bar-stacked') {
      dataToUse = monthlyStackedBarChartData;
      xAxisDataKey = 'month';
    } else if (chartType === 'waterfall') {
      dataToUse = dailyNetChangeData;
      xAxisDataKey = 'date';
    } else {
      dataToUse = combinedLineChartData;
      xAxisDataKey = 'date';
    }

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
            formatter={(value, name) => {
              const formattedName = String(name).replace('_projected', ' (Projected)');
              return `${formattedName}: ${formatCurrency(Number(value))}`;
            }}
          />
        }
      />
    );

    let ChartComponent: React.ElementType;
    let ItemComponent: any;

    switch (chartType) {
      case 'line':
        ChartComponent = ComposedChart; // Use ComposedChart to support mixed Area and Line
        ItemComponent = Area;

        return (
          <ChartComponent {...commonChartProps}>
            <defs>
              {accountsToDisplay.map(account => {
                const color = dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888';
                const id = `gradient-${slugify(account)}`;
                return (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid vertical={false} stroke={isFinancialPulse ? "rgba(255,255,255,0.1)" : "#e5e7eb"} />
            <XAxis
              dataKey={xAxisDataKey}
              {...commonAxisProps}
              tickFormatter={(value) => value}
              tick={{ fill: isFinancialPulse ? '#94a3b8' : '#666', fontSize: 12 }}
              stroke={isFinancialPulse ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
            />
            <YAxis
              {...commonAxisProps}
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{ fill: isFinancialPulse ? '#94a3b8' : '#666', fontSize: 12 }}
              stroke={isFinancialPulse ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
            />
            {commonTooltip}
            {accountsToDisplay.map(account => (
              <React.Fragment key={account}>
                <ItemComponent
                  dataKey={account}
                  type="monotone"
                  stroke={
                    activeLine === null
                      ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                      : (activeLine === account
                        ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                        : '#ccc')
                  }
                  fill={`url(#gradient-${slugify(account)})`}
                  fillOpacity={1}
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  dot={false}
                  onClick={() => handleLineClick(account)}
                  style={{ cursor: 'pointer' }}
                  connectNulls
                />
                {/* Visual projection line - keep as Line or make Area if continuous */}
                <Line
                  dataKey={`${account}_projected`}
                  type="monotone"
                  stroke={
                    activeLine === null
                      ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                      : (activeLine === account
                        ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                        : '#ccc')
                  }
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  onClick={() => handleLineClick(account)}
                  style={{ cursor: 'pointer', opacity: 0.8 }}
                  connectNulls
                  isAnimationActive={false} /* Reduce noise on projection updates */
                />
              </React.Fragment>
            ))}
          </ChartComponent>
        );

      case 'bar-stacked':
        return (
          <BarChart {...commonChartProps}>
            <CartesianGrid vertical={false} stroke={isFinancialPulse ? "rgba(255,255,255,0.1)" : "#e5e7eb"} />
            <XAxis
              dataKey={xAxisDataKey}
              {...commonAxisProps}
              tickFormatter={(value) => value.slice(0, 7)}
              tick={{ fill: isFinancialPulse ? '#94a3b8' : '#666', fontSize: 12 }}
              stroke={isFinancialPulse ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
            />
            <YAxis
              {...commonAxisProps}
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{ fill: isFinancialPulse ? '#94a3b8' : '#666', fontSize: 12 }}
              stroke={isFinancialPulse ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
            />
            {commonTooltip}
            {accountsToDisplay.map(account => (
              <Bar
                key={account}
                dataKey={account}
                stackId="a"
                radius={4}
                onClick={(_data, monthIndex) => handleBarClick(_data, monthIndex, account)}
              >
                {dataToUse.map((_entry, monthIndex) => (
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
            <CartesianGrid vertical={false} stroke={isFinancialPulse ? "rgba(255,255,255,0.1)" : "#e5e7eb"} />
            <XAxis
              dataKey={xAxisDataKey}
              {...commonAxisProps}
              tickFormatter={(value) => value}
              tick={{ fill: isFinancialPulse ? '#94a3b8' : '#666', fontSize: 12 }}
              stroke={isFinancialPulse ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
            />
            <YAxis
              {...commonAxisProps}
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{ fill: isFinancialPulse ? '#94a3b8' : '#666', fontSize: 12 }}
              stroke={isFinancialPulse ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
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
                {dataToUse.map((entry, index) => {
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
        return <></>;
    }
  };

  return (
    <ThemedCard>
      <ThemedCardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center p-6">
          <ThemedCardTitle>Balance Over Time</ThemedCardTitle>
          <ThemedCardDescription>
            Total balance: {formatCurrency(totalBalance)}
          </ThemedCardDescription>
        </div>
        <div className="flex items-center gap-1 p-6">
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
      </ThemedCardHeader>
      <ThemedCardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={dynamicChartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          {renderChart()}
        </ChartContainer>
      </ThemedCardContent>
    </ThemedCard>
  );
}