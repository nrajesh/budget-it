"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Sector, Cell } from "recharts"; // Import Cell and Sector
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";

interface SpendingCategoriesChartProps {
  transactions: Transaction[];
}

// Custom active shape component to display details in the center
const ActivePieShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, formatCurrency } = props;
  const { category, amount } = payload;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10} // Slightly larger for active state
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-200 ease-in-out"
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-200 ease-in-out"
      />
      <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central" fill="#333" className="font-bold text-lg">
        {category}
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" dominantBaseline="central" fill="#666" className="text-md">
        {formatCurrency(amount)}
      </text>
    </g>
  );
};

export function SpendingCategoriesChart({ transactions }: SpendingCategoriesChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const { categories: allCategories } = useTransactions();

  // State to keep track of the active (clicked) slice index
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  // Handler for clicking a pie slice
  const onPieClick = useCallback((data: any, index: number) => {
    setActiveIndex(prevIndex => (prevIndex === index ? null : index));
  }, []);

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
              outerRadius={80} // Set a fixed outerRadius for the main pie
              strokeWidth={5}
              activeIndex={activeIndex} // Pass activeIndex to Pie
              activeShape={(props) => activeIndex !== null ? <ActivePieShape {...props} formatCurrency={formatCurrency} /> : null} // Only render activeShape if activeIndex is not null
              onClick={onPieClick} // Handle click for toggling active state
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} /> // Use entry.fill from chartData
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}