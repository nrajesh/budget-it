import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Added CardFooter
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
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
  Rent: {
    label: "Rent",
    color: "hsl(var(--chart-3))",
  },
  Transport: {
    label: "Transport",
    color: "hsl(var(--chart-4))",
  },
  Entertainment: {
    label: "Entertainment",
    color: "hsl(var(--chart-5))",
  },
  Salary: {
    label: "Salary",
    color: "hsl(var(--chart-6))",
  },
  Investments: {
    label: "Investments",
    color: "hsl(var(--chart-7))",
  },
  Other: {
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
    <Card className="flex flex-col">
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
              content={<ChartTooltipContent hideLabel formatter={(value) => formatCurrency(Number(value))} />}
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
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          {chartData.map((item) => (
            <div key={item.category} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <Label className="font-normal">{item.category}</Label>
              </div>
              <div className="font-medium">{formatCurrency(item.amount)}</div>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}