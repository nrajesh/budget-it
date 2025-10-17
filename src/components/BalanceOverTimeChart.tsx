"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, BarChart, Bar, Cell } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDateToDDMMYYYY, cn } from "@/lib/utils"; // Added cn
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, CalendarIcon, RotateCcw } from "lucide-react"; // Added CalendarIcon, RotateCcw
import { Calendar } from "@/components/ui/calendar"; // Added Calendar
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Added Popover components
import { format } from "date-fns"; // Added format from date-fns

interface BalanceOverTimeChartProps {
  transactions: Transaction[];
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

type ChartType = 'line' | 'bar-stacked' | 'waterfall';

export function BalanceOverTimeChart({ transactions }: BalanceOverTimeChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const [allDefinedAccounts, setAllDefinedAccounts] = React.useState<string[]>([]);
  const [activeLine, setActiveLine] = React.useState<string | null>(null);
  const [activeBar, setActiveBar] = React.useState<{ monthIndex: number; dataKey: string } | null>(null);
  const [chartType, setChartType] = React.useState<ChartType>('line');
  const [selectedFromDate, setSelectedFromDate] = React.useState<Date | undefined>(undefined); // New state for from date
  const [selectedToDate, setSelectedToDate] = React.useState<Date | undefined>(undefined); // New state for to date

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

  const { minTransactionDate, maxTransactionDate } = React.useMemo(() => {
    if (transactions.length === 0) return { minTransactionDate: undefined, maxTransactionDate: undefined };
    const dates = transactions.map(t => new Date(t.date).getTime());
    const minTime = Math.min(...dates);
    const maxTime = Math.max(...dates);
    return {
      minTransactionDate: new Date(minTime),
      maxTransactionDate: new Date(maxTime)
    };
  }, [transactions]);

  // Data for Line and Area Charts (daily running balances)
  const dailyRunningBalanceData = React.useMemo(() => {
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

  // Filtered daily data based on selected dates
  const filteredDailyChartData = React.useMemo(() => {
    if (!selectedFromDate && !selectedToDate) return dailyRunningBalanceData;

    return dailyRunningBalanceData.filter(entry => {
      // Convert DD/MM/YYYY to YYYY-MM-DD for Date object comparison
      const [day, month, year] = entry.date.split('/');
      const entryDate = new Date(`${year}-${month}-${day}`);
      let isValid = true;
      if (selectedFromDate) {
        isValid = isValid && entryDate >= selectedFromDate;
      }
      if (selectedToDate) {
        // Set toDate to end of day to include transactions on that day
        const endOfDayToDate = new Date(selectedToDate);
        endOfDayToDate.setHours(23, 59, 59, 999);
        isValid = isValid && entryDate <= endOfDayToDate;
      }
      return isValid;
    });
  }, [dailyRunningBalanceData, selectedFromDate, selectedToDate]);

  // Filtered monthly data based on selected dates
  const filteredMonthlyStackedBarChartData = React.useMemo(() => {
    if (!selectedFromDate && !selectedToDate) return monthlyStackedBarChartData;

    return monthlyStackedBarChartData.filter(entry => {
      // entry.month is 'YYYY-MM'
      const entryDate = new Date(entry.month); // This will be the 1st of the month
      let isValid = true;
      if (selectedFromDate) {
        isValid = isValid && entryDate >= new Date(selectedFromDate.getFullYear(), selectedFromDate.getMonth(), 1);
      }
      if (selectedToDate) {
        // Compare with the last day of the month for selectedToDate
        const lastDayOfToMonth = new Date(selectedToDate.getFullYear(), selectedToDate.getMonth() + 1, 0);
        isValid = isValid && entryDate <= lastDayOfToMonth;
      }
      return isValid;
    });
  }, [monthlyStackedBarChartData, selectedFromDate, selectedToDate]);

  // Data for Waterfall Chart (daily net changes) - RECALCULATED based on filteredDailyChartData
  const filteredDailyNetChangeData = React.useMemo(() => {
    const data = filteredDailyChartData; // Use filtered data here
    if (data.length === 0) return [];

    const netChanges: { date: string; totalChange: number; [key: string]: number | string }[] = [];
    let previousDayBalances: { [account: string]: number } = {};

    // Initialize previousDayBalances with the first day's balances if available, otherwise 0
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
  }, [filteredDailyChartData, accountsToDisplay]); // Dependency on filteredDailyChartData


  const totalBalance = React.useMemo(() => {
    let dataToUse;
    if (chartType === 'bar-stacked') {
      dataToUse = filteredMonthlyStackedBarChartData;
    } else if (chartType === 'waterfall') {
      // For waterfall, total balance is the sum of all changes, which is the final running balance
      if (filteredDailyChartData.length === 0) return 0;
      const lastDayBalances = filteredDailyChartData[filteredDailyChartData.length - 1];
      return accountsToDisplay.reduce((sum, account) => {
        const balance = lastDayBalances[account];
        return sum + (typeof balance === 'number' ? balance : 0);
      }, 0);
    } else { // line chart
      dataToUse = filteredDailyChartData;
    }

    if (dataToUse.length === 0) return 0;
    const lastDayBalances = dataToUse[dataToUse.length - 1];
    return accountsToDisplay.reduce((sum, account) => {
      const balance = lastDayBalances[account];
      return sum + (typeof balance === 'number' ? balance : 0);
    }, 0);
  }, [filteredDailyChartData, filteredMonthlyStackedBarChartData, accountsToDisplay, chartType]);

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
    let dataToUse;
    let xAxisDataKey;

    if (chartType === 'bar-stacked') {
      dataToUse = filteredMonthlyStackedBarChartData;
      xAxisDataKey = 'month';
    } else if (chartType === 'waterfall') {
      dataToUse = filteredDailyNetChangeData;
      xAxisDataKey = 'date';
    } else { // line chart
      dataToUse = filteredDailyChartData;
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
                stackId="a" // Stack bars to show total daily change
                radius={4}
                onClick={(data, monthIndex) => handleBarClick(data, monthIndex, account)} // Reusing bar click handler
              >
                {dataToUse.map((entry, index) => {
                  const value = entry[account] as number;
                  const color = value >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))'; // Green for positive, Red for negative
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
          {(selectedFromDate || selectedToDate) && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                setSelectedFromDate(undefined);
                setSelectedToDate(undefined);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset Dates
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !selectedFromDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedFromDate ? format(selectedFromDate, "PPP") : <span>From Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedFromDate}
                onSelect={setSelectedFromDate}
                initialFocus
                fromDate={minTransactionDate}
                toDate={maxTransactionDate}
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !selectedToDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedToDate ? format(selectedToDate, "PPP") : <span>To Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedToDate}
                onSelect={setSelectedToDate}
                initialFocus
                fromDate={minTransactionDate}
                toDate={maxTransactionDate}
              />
            </PopoverContent>
          </Popover>
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