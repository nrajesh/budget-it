import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDateToDDMMYYYY } from "@/lib/utils"; // Import formatDateToDDMMYYYY

interface BalanceOverTimeChartProps {
  transactions: Transaction[];
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function BalanceOverTimeChart({ transactions }: BalanceOverTimeChartProps) {
  const { formatCurrency, convertAmount } = useCurrency();
  const [allDefinedAccounts, setAllDefinedAccounts] = React.useState<string[]>([]);

  React.useEffect(() => {
    const fetchAccountNames = async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('name')
        .eq('is_account', true);

      if (error) {
        console.error("Error fetching account names for chart:", error.message);
        setAllDefinedAccounts([]);
      } else {
        setAllDefinedAccounts(data.map(item => item.name));
      }
    };
    fetchAccountNames();
  }, []);

  const accountsToDisplay = React.useMemo(() => {
    const uniqueAccounts = new Set<string>();
    transactions.forEach(t => uniqueAccounts.add(t.account));
    return Array.from(uniqueAccounts);
  }, [transactions]);

  const chartData = React.useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dailyBalances: { [date: string]: { [account: string]: number } } = {};

    allDefinedAccounts.forEach(account => {
      dailyBalances['initial'] = { ...dailyBalances['initial'], [account]: 0 };
    });

    sortedTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!dailyBalances[date]) {
        const previousDate = Object.keys(dailyBalances).sort().pop();
        dailyBalances[date] = previousDate ? { ...dailyBalances[previousDate] } : { ...dailyBalances['initial'] };
      }

      if (dailyBalances[date][transaction.account] !== undefined) {
        dailyBalances[date][transaction.account] += transaction.amount;
      }
    });

    const formattedData = Object.entries(dailyBalances)
      .filter(([date]) => date !== 'initial')
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, balances]) => {
        const obj: { date: string; [key: string]: number | string } = { date: formatDateToDDMMYYYY(date) }; // Format date here
        accountsToDisplay.forEach(account => {
          obj[account] = convertAmount(balances[account] || 0);
        });
        return obj;
      });

    return formattedData;
  }, [transactions, convertAmount, accountsToDisplay, allDefinedAccounts]);

  const totalBalance = React.useMemo(() => {
    if (chartData.length === 0) return 0;
    const lastDayBalances = chartData[chartData.length - 1];
    return accountsToDisplay.reduce((sum, account) => {
      const balance = lastDayBalances[account];
      return sum + (typeof balance === 'number' ? balance : 0);
    }, 0);
  }, [chartData, accountsToDisplay]);

  const dynamicChartConfig = React.useMemo(() => {
    const newConfig = { ...chartConfig };
    allDefinedAccounts.forEach((account, index) => {
      const colorIndex = (index % 4) + 1;
      newConfig[account as keyof typeof newConfig] = {
        label: account,
        color: `hsl(var(--chart-${colorIndex}))`,
      };
    });
    return newConfig;
  }, [allDefinedAccounts]);


  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center p-6">
          <CardTitle>Balance Over Time</CardTitle>
          <CardDescription>
            Total balance: {formatCurrency(totalBalance)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={dynamicChartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value} // Display formatted date directly
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatCurrency(Number(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  formatter={(value, name) => `${name}: ${formatCurrency(Number(value))}`}
                />
              }
            />
            {accountsToDisplay.map(account => (
              <Line
                key={account}
                dataKey={account}
                type="monotone"
                stroke={dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}