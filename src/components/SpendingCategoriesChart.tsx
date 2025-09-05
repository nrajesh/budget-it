import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { type ChartConfig } from "@/components/ui/chart";

interface SpendingCategoriesChartProps {
  data: { name: string; value: number; fill: string }[];
  config: ChartConfig;
}

export function SpendingCategoriesChart({ data, config }: SpendingCategoriesChartProps) {
  const totalValue = React.useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

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
                  formatter={(value, name, item) => {
                    const percentage = totalValue > 0 ? (Number(value) / totalValue) * 100 : 0;
                    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
                    return (
                      <div className="grid grid-cols-[1fr,auto] items-center gap-x-4 w-full">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground">{name}</span>
                        </div>
                        <span className="font-bold text-right">
                          {currencyFormatter.format(Number(value))} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    )
                  }}
                />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              />
              <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-mx-2 flex-wrap justify-center" />
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