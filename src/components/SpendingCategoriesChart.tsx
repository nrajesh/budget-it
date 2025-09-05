import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext"; // Import useCurrency

interface SpendingCategoriesChartProps {
  transactions: Transaction[];
}

const chartConfig = {
  amount: {
    label: "Amount",
  },
  Groceries: {
    label: "Groceries",
    color: "hsl(var(--chart-1))",
  },
  Utilities: {
    label: "Utilities",
    color: "hsl(var(--chart-2))",
  },
  Transport: {
    label: "Transport",
    color: "hsl(var(--chart-3))",
  },
  Entertainment: {
    label: "Entertainment",
    color: "hsl(var(--chart-4))",
  },
  Salary: {
    label: "Salary",
    color: "hsl(var(--chart-5))",
  },
  Shopping: { // Added missing category
    label: "Shopping",
    color: "hsl(var(--chart-6))",
  },
  Health: { // Added missing category
    label: "Health",
    color: "hsl(var(--chart-7))",
  },
  "Dining Out": { // Added missing category
    label: "Dining Out",
    color: "hsl(var(--chart-8))",
  },
  Rent: { // Retained existing category, reusing color
    label: "Rent",
    color: "hsl(var(--chart-1))",
  },
  Investments: { // Retained existing category, reusing color
    label: "Investments",
    color: "hsl(var(--chart-2))",
  },
  Other: { // Fallback category
    label: "Other",
    color: "hsl(var(--chart-8))",
  },
} satisfies ChartConfig;

export function SpendingCategoriesChart({ transactions }: SpendingCategoriesChartProps) {
  const { formatCurrency, convertAmount } = useCurrency(); // Use currency context

  const spendingData = transactions.reduce((acc, transaction) => {
    if (transaction.amount < 0 && transaction.category !== 'Transfer') { // Only consider expenses
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(spendingData).map(([category, amount]) => ({
    category,
    amount: convertAmount(amount), // Convert amount
    // Type assertion here because `category` will always be a key with a `color` property in `chartConfig`
    fill: (chartConfig[category as keyof typeof chartConfig] as { color: string }).color || chartConfig.Other.color,
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
              strokeWidth={5}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      {/* Removed ChartLegend */}
    </Card>
  );
}