import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { type Transaction } from "@/data/finance-data"; // Removed 'accounts as allDefinedAccounts'
import { useCurrency } from "@/contexts/CurrencyContext"; // Import useCurrency
import { supabase } from "@/integrations/supabase/client"; // Import supabase

interface BalanceOverTimeChartProps {
  transactions: Transaction[];
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
  },
  // Dynamic account labels will be added here based on fetched data
} satisfies ChartConfig;

export function BalanceOverTimeChart({ transactions }: BalanceOverTimeChartProps) {
  const { formatCurrency, convertAmount } = useCurrency(); // Use currency context
  const [allDefinedAccounts, setAllDefinedAccounts] = React.useState<string[]>([]);

  // Fetch all account names dynamically
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

  // Dynamically determine which accounts have transactions in the filtered data
  const accountsToDisplay = React.useMemo(() => {
    const uniqueAccounts = new Set<string>();
    transactions.forEach(t => uniqueAccounts.add(t.account));
    return Array.from(uniqueAccounts);
  }, [transactions]);

  const chartData = React.useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dailyBalances: { [date: string]: { [account: string]: number } } = {};

    // Initialize balances for all *possible* accounts to 0 for consistent tracking
    allDefinedAccounts.forEach(account => {
      dailyBalances['initial'] = { ...dailyBalances['initial'], [account]: 0 };
    });

    sortedTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!dailyBalances[date]) {
        // Carry over previous day's balance if this is the first transaction for the day
        const previousDate = Object.keys(dailyBalances).sort().pop();
        dailyBalances[date] = previousDate ? { ...dailyBalances[previousDate] } : { ...dailyBalances['initial'] };
      }

      // Apply transaction amount to the specific account
      if (dailyBalances[date][transaction.account] !== undefined) {
        dailyBalances[date][transaction.account] += transaction.amount;
      }
    });

    // Convert dailyBalances object to an array of objects for Recharts
    const formattedData = Object.entries(dailyBalances)
      .filter(([date]) => date !== 'initial') // Remove the initial placeholder
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, balances]) => {
        const obj: { date: string; [key: string]: number | string } = { date };
        // Only include balances for accounts that are actually being displayed
        accountsToDisplay.forEach(account => {
          obj[account] = convertAmount(balances[account] || 0); // Convert balance
        });
        return obj;
      });

    return formattedData;
  }, [transactions, convertAmount, accountsToDisplay, allDefinedAccounts]); // Added allDefinedAccounts to dependencies

  const totalBalance = React.useMemo(() => {
    if (chartData.length === 0) return 0;
    const lastDayBalances = chartData[chartData.length - 1];
    return accountsToDisplay.reduce((sum, account) => {
      const balance = lastDayBalances[account];
      return sum + (typeof balance === 'number' ? balance : 0);
    }, 0);
  }, [chartData, accountsToDisplay]);

  // Dynamically update chartConfig with fetched account colors
  const dynamicChartConfig = React.useMemo(() => {
    const newConfig = { ...chartConfig };
    allDefinedAccounts.forEach((account, index) => {
      // Assign a color from a predefined set or generate one
      const colorIndex = (index % 4) + 1; // Use chart-1 to chart-4 for accounts
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
        {/* Removed MultiSelectDropdown for account selection */}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={dynamicChartConfig} // Use dynamicChartConfig
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
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatCurrency(Number(value))} // Format Y-axis labels
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  formatter={(value, name) => `${name}: ${formatCurrency(Number(value))}`} // Format tooltip values
                />
              }
            />
            {accountsToDisplay.map(account => (
              <Line
                key={account}
                dataKey={account}
                type="monotone"
                stroke={dynamicChartConfig[account as keyof typeof dynamicChartConfig]?.color} // Use dynamicChartConfig
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