import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import React from "react";

interface SpendingByVendorChartProps {
  transactions: Transaction[];
}

// Define a dynamic chart config for vendors
const getVendorChartConfig = (vendors: string[]) => {
  const config: ChartConfig = {
    amount: {
      label: "Amount",
    },
  };
  vendors.forEach((vendor, index) => {
    // Assign a color from a predefined set or generate one
    const colorIndex = (index % 8) + 1; // Use chart-1 to chart-8 for colors
    config[vendor] = {
      label: vendor,
      color: `hsl(var(--chart-${colorIndex}))`,
    };
  });
  return config;
};

export function SpendingByVendorChart({ transactions }: SpendingByVendorChartProps) {
  const { formatCurrency, convertAmount } = useCurrency();

  const spendingData = transactions.reduce((acc, transaction) => {
    if (transaction.amount < 0 && transaction.category !== 'Transfer') { // Only consider expenses
      const vendor = transaction.vendor;
      acc[vendor] = (acc[vendor] || 0) + Math.abs(transaction.amount);
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(spendingData).map(([vendor, amount]) => ({
    vendor,
    amount: convertAmount(amount),
  }));

  // Sort data by amount in descending order and take top N, then group others into "Other"
  const sortedChartData = chartData.sort((a, b) => b.amount - a.amount);
  const topVendorsCount = 5; // Show top 5 vendors
  const topVendors = sortedChartData.slice(0, topVendorsCount);
  const otherSpending = sortedChartData.slice(topVendorsCount).reduce((sum, item) => sum + item.amount, 0);

  const finalChartData = topVendors;
  if (otherSpending > 0) {
    finalChartData.push({ vendor: "Other", amount: otherSpending });
  }

  const totalSpending = finalChartData.reduce((sum, item) => sum + item.amount, 0);

  const dynamicChartConfig = React.useMemo(() => getVendorChartConfig(finalChartData.map(item => item.vendor)), [finalChartData]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Spending by Vendor</CardTitle>
        <CardDescription>Total spending: {formatCurrency(totalSpending)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={dynamicChartConfig}
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