import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import React from "react";

interface SpendingByVendorChartProps {
  transactions: Transaction[];
}

const getVendorChartConfig = (vendors: string[]) => {
  const config: ChartConfig = {
    amount: {
      label: "Amount",
    },
  };
  vendors.forEach((vendor, index) => {
    const colorIndex = (index % 8) + 1;
    config[vendor] = {
      label: vendor,
      color: `hsl(var(--chart-${colorIndex}))`,
    };
  });
  return config;
};

export function SpendingByVendorChart({ transactions }: SpendingByVendorChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();

  const allUniqueVendors = React.useMemo(() => {
    const vendorsSet = new Set<string>();
    transactions.forEach(t => {
      if (t.amount < 0 && t.category !== 'Transfer') {
        vendorsSet.add(t.vendor);
      }
    });
    return Array.from(vendorsSet);
  }, [transactions]);

  const comprehensiveChartConfig = React.useMemo(() => getVendorChartConfig(allUniqueVendors), [allUniqueVendors]);

  const spendingData = transactions.reduce((acc, transaction) => {
    if (transaction.amount < 0 && transaction.category !== 'Transfer') {
      const vendor = transaction.vendor;
      const convertedAmount = convertBetweenCurrencies(Math.abs(transaction.amount), transaction.currency, selectedCurrency);
      acc[vendor] = (acc[vendor] || 0) + convertedAmount;
    }
    return acc;
  }, {} as Record<string, number>);

  const chartDataWithColors = Object.entries(spendingData).map(([vendor, amount]) => ({
    vendor,
    amount: amount,
    fill: (comprehensiveChartConfig[vendor as keyof typeof comprehensiveChartConfig] as { color: string })?.color || "hsl(var(--chart-8))",
  }));

  const sortedChartData = chartDataWithColors.sort((a, b) => b.amount - a.amount);
  const topVendorsCount = 5;
  const topVendors = sortedChartData.slice(0, topVendorsCount);
  const otherSpending = sortedChartData.slice(topVendorsCount).reduce((sum, item) => sum + item.amount, 0);

  const finalChartData = topVendors;
  if (otherSpending > 0) {
    finalChartData.push({ vendor: "Other", amount: otherSpending, fill: "hsl(var(--chart-7))" });
  }

  const totalSpending = finalChartData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Spending by Vendor</CardTitle>
        <CardDescription>Total spending: {formatCurrency(totalSpending)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={comprehensiveChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel formatter={(value, name) => `${name}: ${formatCurrency(Number(value))}`} />}
            />
            <Pie
              data={finalChartData}
              dataKey="amount"
              nameKey="vendor"
              innerRadius={60}
              strokeWidth={5}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}