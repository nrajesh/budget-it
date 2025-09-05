"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { useTransactions } from "@/contexts/TransactionsContext";
import { accounts as allAccounts } from "@/data/finance-data";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-');

export function BalanceOverTimeChart() {
  const accountSlugs = React.useMemo(() => allAccounts.map(slugify), []);
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>(accountSlugs);
  const { transactions } = useTransactions();

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    allAccounts.forEach((account, index) => {
      const slug = slugify(account);
      config[slug] = {
        label: account,
        color: `hsl(var(--chart-${index + 1}))`,
      };
    });
    return config;
  }, []);

  const chartData = React.useMemo(() => {
    if (transactions.length === 0) return [];

    const dailyChanges: { [date: string]: { [accountSlug: string]: number } } = {};
    for (const t of transactions) {
        const date = new Date(t.date).toISOString().split('T')[0];
        const accountSlug = slugify(t.account);
        if (!dailyChanges[date]) dailyChanges[date] = {};
        // Ensure amount is a number, default to 0 if not
        const amount = typeof t.amount === 'number' ? t.amount : 0;
        if (!dailyChanges[date][accountSlug]) dailyChanges[date][accountSlug] = 0;
        dailyChanges[date][accountSlug] += amount;
    }

    const sortedDates = Object.keys(dailyChanges).sort();
    const cumulativeBalances: { [accountSlug: string]: number } = {};
    accountSlugs.forEach(slug => cumulativeBalances[slug] = 0);

    return sortedDates.map(date => {
        const changes = dailyChanges[date];
        const record: { [key: string]: any } = { date };
        accountSlugs.forEach(slug => {
            // Ensure changes[slug] is a number before adding
            const changeAmount = typeof changes[slug] === 'number' ? changes[slug] : 0;
            cumulativeBalances[slug] += changeAmount;
            // Ensure cumulative balance is non-negative for percentage chart
            record[slug] = Math.max(0, cumulativeBalances[slug]);
        });
        return record;
    });
  }, [transactions, accountSlugs]);

  const handleAccountToggle = (accountSlug: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountSlug)
        ? prev.filter(a => a !== accountSlug)
        : [...prev, accountSlug]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Composition Over Time</CardTitle>
        <CardDescription>Relative balance of each account over time.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
            stackOffset="expand"
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            />
            <YAxis
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              domain={[0, 1]}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                formatter={(value, name, item) => {
                    const payload = item.payload;
                    const accountLabel = chartConfig[name as keyof typeof chartConfig]?.label;
                    // Ensure originalValue is a number
                    const originalValue = typeof payload[name] === 'number' ? payload[name] : 0; 
                    const totalForVisible = selectedAccounts.reduce((acc, slug) => acc + (typeof payload[slug] === 'number' ? payload[slug] : 0), 0);
                    const percentage = totalForVisible > 0 ? (originalValue / totalForVisible) * 100 : 0;
                    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

                    return (
                        <div className="w-full flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: item.color }} />
                                <span className="text-muted-foreground">{accountLabel}</span>
                            </div>
                            <span className="font-bold text-foreground">
                                {currencyFormatter.format(originalValue)} ({percentage.toFixed(1)}%)
                            </span>
                        </div>
                    );
                }}
              />}
            />
            {selectedAccounts.map((accountSlug) => (
              <Area
                key={accountSlug}
                dataKey={accountSlug}
                name={accountSlug}
                type="monotone"
                fill={`var(--color-${accountSlug})`}
                stroke={`var(--color-${accountSlug})`}
                stackId="a"
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-x-6 gap-y-2 border-t pt-4">
        {allAccounts.map(account => {
          const slug = slugify(account);
          return (
            <div key={slug} className="flex items-center space-x-2">
              <Checkbox
                id={slug}
                checked={selectedAccounts.includes(slug)}
                onCheckedChange={() => handleAccountToggle(slug)}
              />
              <Label htmlFor={slug} className="text-sm font-medium leading-none flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartConfig[slug]?.color }} />
                {account}
              </Label>
            </div>
          )
        })}
      </CardFooter>
    </Card>
  );
}