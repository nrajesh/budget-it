import * as React from "react";
import {
  DollarSign,
  FileText,
} from "lucide-react";
import {
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import Layout from "@/components/Layout";
import { incomeVsExpensesData, spendingCategoriesData, chartConfig } from "@/data/finance-data";

const Index = () => {
  return (
    <Layout pageTitle="Dashboard">
      <div className="grid gap-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Check your financial overview
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row">
            <div className="grid flex-1 grid-cols-2 gap-4">
              <div className="rounded-lg bg-primary/80 p-4">
                <p className="text-sm text-primary-foreground/80">
                  Income
                </p>
                <p className="text-2xl font-bold">$5,400</p>
              </div>
              <div className="rounded-lg bg-primary/80 p-4">
                <p className="text-sm text-primary-foreground/80">
                  Savings Rate
                </p>
                <p className="text-2xl font-bold">25%</p>
              </div>
            </div>
            <div className="hidden sm:block">
              <img
                src="/placeholder.svg"
                alt="Welcome illustration"
                className="h-32 w-32"
              />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Spending
              </CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$1,890</div>
              <p className="text-xs text-red-500">+10% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bills Due
              </CardTitle>
              <FileText className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                2 due this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Net Worth
              </CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$120k</div>
              <p className="text-xs text-green-500">+2% from last month</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <LineChart data={incomeVsExpensesData}>
                  <RechartsTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) => `$${value / 1000}k`}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Spending Categories</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-48"
              >
                <RadialBarChart
                  data={spendingCategoriesData}
                  startAngle={90}
                  endAngle={-270}
                  innerRadius="70%"
                  outerRadius="100%"
                >
                  <RechartsTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value) => `${value}%`}
                      />
                    }
                  />
                  <RadialBar dataKey="value" background />
                </RadialBarChart>
              </ChartContainer>
              <div className="grid w-full grid-cols-2 gap-2 text-sm">
                {Object.entries(chartConfig)
                  .slice(2)
                  .map(([key, config]: [string, { label: string; color: string }]) => {
                    const item = spendingCategoriesData.find(
                      (d) => d.name === key,
                    );
                    if (!item) return null;
                    return (
                      <div key={config.label} className="flex items-center gap-2">
                        <div
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span>{config.label}</span>
                        <span className="ml-auto font-medium">
                          {item.value}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;