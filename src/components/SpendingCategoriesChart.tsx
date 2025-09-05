import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { type ChartConfig } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SpendingCategoriesChartProps {
  data: { name: string; value: number; fill: string }[];
  config: ChartConfig;
}

export function SpendingCategoriesChart({ data, config }: SpendingCategoriesChartProps) {
  const allCategoryNames = React.useMemo(() => data.map(d => d.name), [data]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(allCategoryNames);

  React.useEffect(() => {
    setSelectedCategories(data.map(d => d.name));
  }, [data]);

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const chartData = React.useMemo(() => {
    return data.filter(item => selectedCategories.includes(item.name));
  }, [data, selectedCategories]);

  const totalValue = React.useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Breakdown of your expenses.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[250px]"
        >
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
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-mx-2 flex-wrap justify-center" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm border-t pt-4">
        <div className="w-full font-medium text-muted-foreground">Filter by Category</div>
        <div className="w-full flex flex-wrap gap-x-4 gap-y-2">
          {data.map(item => (
            <div key={item.name} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-filter-${item.name.replace(/\s+/g, '-')}`}
                checked={selectedCategories.includes(item.name)}
                onCheckedChange={() => handleCategoryToggle(item.name)}
              />
              <Label htmlFor={`cat-filter-${item.name.replace(/\s+/g, '-')}`} className="text-sm font-medium leading-none flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                {item.name}
              </Label>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}