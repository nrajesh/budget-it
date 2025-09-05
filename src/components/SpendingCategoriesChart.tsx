import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { type ChartConfig } from "@/components/ui/chart";
import { useCurrency } from "@/contexts/CurrencyContext";

interface SpendingCategoriesChartProps {
  data: { name: string; value: number; fill: string }[];
  config: ChartConfig;
}

export function SpendingCategoriesChart({ data, config }: SpendingCategoriesChartProps) {
  const { formatCurrency } = useCurrency();
  const totalValue = React.useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  const tooltipFormatter = (value: any, name: any, item: any) => {
    const percentage = totalValue > 0 ? (Number(value) / totalValue) * 100 : 0;
    return (
      <div className="grid grid-cols-[1fr,auto] items-center gap-x-4 w-full">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: item.color }} />
          <span className="text-muted-foreground">{name}</span>
        </div>
        <span className="font-bold text-right">
          {formatCurrency(Number(value))} ({percentage.toFixed(1)}%)
        </span>
      </div>
    )
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Breakdown of your expenses.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[300px]"
        >
          {data.length > 0 ? (
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                  hideLabel
                  formatter={tooltipFormatter}
                />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              />
            </PieChart>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data for selected categories.
            </div>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}