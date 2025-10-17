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

type ChartType = 'line' | 'bar-stacked' | 'candlestick';

export function BalanceOverTimeChart({ transactions }: BalanceOverTimeChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const [allDefinedAccounts, setAllDefinedAccounts] = React.useState<string[]>([]);
  const [activeLine, setActiveLine] = React.useState<string | null>(null);
  const [activeBar, setActiveBar] = React.useState<{ monthIndex: number; dataKey: string } | null>(null);
  const chartType = React.useRef<ChartType>('line'); // Corrected useRef declaration
  const [zoomRange, setZoomRange] = React.useState<{ startIndex: number; endIndex: number } | null>(null);

  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStartX, setDragStartX] = React.useState<number | null>(null);
  const [dragCurrentX, setDragCurrentX] = React.useState<number | null>(null);
  const [chartWidth, setChartWidth] = React.useState(0);

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

  const dailyCandlestickChartData = React.useMemo(() => {
    const data = dailyRunningBalanceData;
    if (data.length === 0) return [];

    const candlestickData: { date: string; [key: string]: number | string }[] = [];
    let prevDayBalances: { [account: string]: number } = {};

    allDefinedAccounts.forEach(account => {
        prevDayBalances[account] = 0;
    });

    data.forEach((currentDay, index) => {
        const dayEntry: { date: string; [key: string]: number | string } = { date: currentDay.date };
        accountsToDisplay.forEach(account => {
            const currentClose = (currentDay[account] as number) || 0;
            const currentOpen = prevDayBalances[account] || 0;
            const netChange = currentClose - currentOpen;

            dayEntry[`${account}_change`] = netChange;
            dayEntry[`${account}_open`] = currentOpen;
            dayEntry[`${account}_close`] = currentClose;
            dayEntry[`${account}_high`] = Math.max(currentOpen, currentClose);
            dayEntry[`${account}_low`] = Math.min(currentOpen, currentClose);
        });
        candlestickData.push(dayEntry);

        accountsToDisplay.forEach(account => {
            prevDayBalances[account] = (currentDay[account] as number) || 0;
        });
    });
    return candlestickData;
  }, [dailyRunningBalanceData, accountsToDisplay, allDefinedAccounts]);


  const totalBalance = React.useMemo(() => {
    let dataToUse;
    if (chartType.current === 'bar-stacked') {
      dataToUse = monthlyStackedBarChartData;
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

  const { currentDataToUse, currentXAxisDataKey } = React.useMemo(() => {
    let data;
    let key;
    if (chartType.current === 'bar-stacked') {
      data = monthlyStackedBarChartData;
      key = 'month';
    } else if (chartType.current === 'candlestick') {
      data = dailyCandlestickChartData;
      key = 'date';
    } else {
      data = dailyRunningBalanceData;
      key = 'date';
    }
    return { currentDataToUse: data, currentXAxisDataKey: key };
  }, [chartType.current, monthlyStackedBarChartData, dailyCandlestickChartData, dailyRunningBalanceData]);

  const chartPaddingLeft = 12;
  const chartPaddingRight = 12;

  React.useLayoutEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth - chartPaddingLeft - chartPaddingRight);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (chartContainerRef.current) {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragCurrentX(e.clientX);
      setZoomRange(null);
    }
  }, []);

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setDragCurrentX(e.clientX);
    }
  }, [isDragging]);

  const handleMouseUp = React.useCallback(() => {
    if (isDragging && dragStartX !== null && dragCurrentX !== null && chartContainerRef.current && chartWidth > 0) {
      const chartRect = chartContainerRef.current.getBoundingClientRect();
      const dataLength = currentDataToUse.length;

      const startPixel = Math.min(dragStartX, dragCurrentX) - chartRect.left - chartPaddingLeft;
      const endPixel = Math.max(dragStartX, dragCurrentX) - chartRect.left - chartPaddingLeft;

      const newStartIndex = Math.floor((startPixel / chartWidth) * dataLength);
      const newEndIndex = Math.ceil((endPixel / chartWidth) * dataLength) - 1;

      if (newEndIndex > newStartIndex && (endPixel - startPixel) > 10) {
        setZoomRange({
          startIndex: Math.max(0, newStartIndex),
          endIndex: Math.min(dataLength - 1, newEndIndex)
        });
      } else {
        setZoomRange(null);
      }
    }
    setIsDragging(false);
    setDragStartX(null);
    setDragCurrentX(null);
  }, [isDragging, dragStartX, dragCurrentX, currentDataToUse, chartWidth, chartPaddingLeft]);

  React.useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  React.useEffect(() => {
    setZoomRange(null);
    setIsDragging(false);
    setDragStartX(null);
    setDragCurrentX(null);
  }, [chartType.current, dailyRunningBalanceData, monthlyStackedBarChartData, dailyCandlestickChartData]);

  const handleLineClick = React.useCallback((dataKey: string) => {
    setActiveLine(prevActiveLine => (prevActiveLine === dataKey ? null : dataKey));
  }, []);

  const handleBarClick = React.useCallback((data: any, index: number, clickedDataKey: string) => {
    setActiveBar(prevActiveBar => {
      if (prevActiveBar?.monthIndex === index && prevActiveBar?.dataKey === clickedDataKey) {
        return null;
      } else {
        return { monthIndex: index, dataKey: clickedDataKey };
      }
    });
  }, []);

  const selectionRect = React.useMemo(() => {
    if (!isDragging || dragStartX === null || dragCurrentX === null || !chartContainerRef.current) {
      return null;
    }
    const chartRect = chartContainerRef.current.getBoundingClientRect();
    const left = Math.min(dragStartX, dragCurrentX) - chartRect.left;
    const right = Math.max(dragStartX, dragCurrentX) - chartRect.left;
    const width = right - left;

    return {
      left: left,
      width: width,
      height: chartRect.height,
      top: 0,
    };
  }, [isDragging, dragStartX, dragCurrentX]);


  const renderChart = () => {
    if (currentDataToUse.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No transaction data available to display.</p>;
    }

    const commonChartProps = {
      accessibilityLayer: true,
      data: currentDataToUse,
      margin: { left: chartPaddingLeft, right: chartPaddingRight },
      className: "aspect-auto h-[250px] w-full",
      startIndex: zoomRange?.startIndex,
      endIndex: zoomRange?.endIndex,
    };

    const commonAxisProps = {
      tickLine: false,
      axisLine: false,
      tickMargin: 8,
      minTickGap: 32,
    };

    let ChartComponent: React.ElementType;
    let ItemComponent: React.ElementType;

    switch (chartType.current) {
      case 'line':
        ChartComponent = LineChart;
        ItemComponent = Line;

        return (
          <ChartComponent {...commonChartProps}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={currentXAxisDataKey}
              {...commonAxisProps}
              tickFormatter={(value) => value}
            />
            <YAxis
              {...commonAxisProps}
              tickFormatter={(value) => formatCurrency(Number(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  formatter={(value, name, props) => `${name}: ${formatCurrency(Number(value))}`}
                />
              }
            />
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
              dataKey={currentXAxisDataKey}
              {...commonAxisProps}
              tickFormatter={(value) => value.slice(0, 7)}
            />
            <YAxis
              {...commonAxisProps}
              tickFormatter={(value) => formatCurrency(Number(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  formatter={(value, name, props) => `${name}: ${formatCurrency(Number(value))}`}
                />
              }
            />
            {accountsToDisplay.map(account => (
              <Bar
                key={account}
                dataKey={account}
                stackId="a"
                radius={4}
                onClick={(data, index) => handleBarClick(data, index, account)}
              >
                {currentDataToUse.map((entry, index) => (
                  <Cell
                    key={`bar-cell-${account}-${index}`}
                    fill={
                      activeBar === null
                        ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                        : (activeBar.monthIndex === index && activeBar.dataKey === account
                          ? (dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color || '#888')
                          : '#ccc')
                    }
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        );

      case 'candlestick':
        return (
          <BarChart {...commonChartProps}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={currentXAxisDataKey}
              {...commonAxisProps}
              tickFormatter={(value) => value}
            />
            <YAxis
              {...commonAxisProps}
              tickFormatter={(value) => formatCurrency(Number(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  formatter={(value, name, props) => {
                    const accountName = (name as string).replace('_change', '');
                    const entry = props.payload?.[0]?.payload;
                    if (entry) {
                      const open = entry[`${accountName}_open`];
                      const close = entry[`${accountName}_close`];
                      const high = entry[`${accountName}_high`];
                      const low = entry[`${accountName}_low`];
                      const change = entry[`${accountName}_change`];

                      return (
                        <div className="flex flex-col p-2 bg-background border rounded-md shadow-sm text-sm">
                          <span className="font-semibold">{accountName}</span>
                          <span>Open: {formatCurrency(Number(open))}</span>
                          <span>Close: {formatCurrency(Number(close))}</span>
                          <span>High: {formatCurrency(Number(high))}</span>
                          <span>Low: {formatCurrency(Number(low))}</span>
                          <span className="font-medium">Change: {formatCurrency(Number(change))}</span>
                        </div>
                      );
                    }
                    return `${name}: ${formatCurrency(Number(value))}`;
                  }}
                />
              }
            />
            {accountsToDisplay.map(account => (
              <Bar
                key={account}
                dataKey={`${account}_change`}
                stackId="a"
                radius={4}
                onClick={(data, index) => handleBarClick(data, index, `${account}_change`)}
              >
                {currentDataToUse.map((entry, index) => {
                  const value = entry[`${account}_change`] as number;
                  const color = value >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))';
                  return (
                    <Cell
                      key={`candlestick-cell-${account}-${index}`}
                      fill={
                        activeBar === null
                          ? color
                          : (activeBar.monthIndex === index && activeBar.dataKey === `${account}_change`
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                {chartType.current === 'line' && 'Line Chart'}
                {chartType.current === 'bar-stacked' && 'Stacked Bar Chart'}
                {chartType.current === 'candlestick' && 'Candlestick Chart'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => chartType.current = 'line'}>
                Line Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => chartType.current = 'bar-stacked'}>
                Stacked Bar Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => chartType.current = 'candlestick'}>
                Candlestick Chart
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={() => {
              setZoomRange(null);
              setIsDragging(false);
              setDragStartX(null);
              setDragCurrentX(null);
            }}
            disabled={!zoomRange}
            className="flex items-center gap-2"
          >
            Reset Zoom
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          ref={chartContainerRef}
          config={dynamicChartConfig}
          className="aspect-auto h-[250px] w-full relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={(e) => handleMouseDown(e.nativeEvent as any)}
          onTouchMove={(e) => handleMouseMove(e.nativeEvent as any)}
          onTouchEnd={handleMouseUp}
        >
          <div> {/* Wrapper div to ensure a single child for ChartContainer */}
            {renderChart()}
            {selectionRect && (
              <div
                className="absolute bg-primary/20 pointer-events-none"
                style={{
                  left: selectionRect.left,
                  width: selectionRect.width,
                  height: selectionRect.height,
                  top: selectionRect.top,
                }}
              />
            )}
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}