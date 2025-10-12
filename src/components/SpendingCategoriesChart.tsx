"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { ActivePieShape } from "./charts/ActivePieShape"; // Import the new component
import { usePieChartInteraction } from "@/hooks/usePieChartInteraction"; // Import the new hook

interface SpendingCategoriesChartProps {
  transactions: Transaction[];
}

export function SpendingCategoriesChart({ transactions }: SpendingCategoriesChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const { categories: allCategories } = useTransactions();
  const { activeIndex, onPieClick, resetActiveIndex } = usePieChartInteraction(); // Use the new hook

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      amount: {
        label: "Amount",
      },
    };
    allCategories.forEach((category, index) => {
      const colorIndex = (index % 8) + 1;
      config[category.name] = {
        label: category.name,
        color: `hsl(var(--chart-${colorIndex}))`,
      };
    });
    config['Other'] = {
      label: "Other",
      color: "hsl(var(--chart-8))",
    };
    return config;
  }, [allCategories]);

  const spendingData = transactions.reduce((acc, transaction) => {
    if (transaction.amount < 0 && transaction.category !== 'Transfer') {
      const category = transaction.category;
      const convertedAmount = convertBetweenCurrencies(Math.abs(transaction.amount), transaction.currency, selectedCurrency);
      acc[category] = (acc[category] || 0) + convertedAmount;
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(spendingData).map(([category, amount]) => ({
    category,
    amount: amount,
    fill: (chartConfig[category as keyof typeof chartConfig] as { color: string })?.color || chartConfig.Other.color,
  }));

  const totalSpending = chartData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Total spending: {formatCurrency(totalSpending)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel formatter={(value, name) => `${name}: ${formatCurrency(Number(value))}`} />}
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="category"
              innerRadius={60}
              outerRadius={80}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={(props) => activeIndex !== null ? <ActivePieShape {...props} formatCurrency={formatCurrency} onCenterClick={resetActiveIndex} /> : null}
              onClick={onPieClick}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}