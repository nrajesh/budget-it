import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import React from "react";

const SpendingByVendorChart = ({ transactions }: { transactions: any[] }) => {
  const { formatCurrency, selectedCurrency, convertAmount } = useCurrency();

  const { chartData, totalSpending } = React.useMemo(() => {
    // ... calculation logic
    return { chartData: [], totalSpending: 0 };
  }, [transactions]);

  const convertedTotalSpending = convertAmount(totalSpending);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Vendor</CardTitle>
        <CardDescription>Total spending: {formatCurrency(convertedTotalSpending, selectedCurrency)}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px] w-full">
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel formatter={(value) => formatCurrency(convertAmount(Number(value)), selectedCurrency)} />}
            />
            <Bar dataKey="value" fill="var(--color-fill)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default SpendingByVendorChart;