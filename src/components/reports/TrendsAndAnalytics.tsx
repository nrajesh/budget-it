import React from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
} from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Budget, Transaction } from "@/data/finance-data";

interface TrendsAndAnalyticsProps {
  transactions: Transaction[];
  budgets: Budget[];
}

const TrendsAndAnalytics: React.FC<TrendsAndAnalyticsProps> = ({
  transactions,
  budgets,
}) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();

  const monthlyData = React.useMemo(() => {
    const dataByMonth: Record<string, { income: number; expenses: number }> =
      {};

    transactions.forEach((t) => {
      const month = new Date(t.date).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      if (!dataByMonth[month]) {
        dataByMonth[month] = { income: 0, expenses: 0 };
      }
      if (t.category !== "Transfer") {
        const convertedAmount = convertBetweenCurrencies(
          t.amount,
          t.currency,
          selectedCurrency,
        );
        if (convertedAmount > 0) {
          dataByMonth[month].income += convertedAmount;
        } else {
          dataByMonth[month].expenses += Math.abs(convertedAmount);
        }
      }
    });

    return Object.entries(dataByMonth)
      .map(([month, values]) => {
        const monthDate = new Date(
          month.replace(/(\w{3})\s(\d{2})/, "$1 1, 20$2"),
        );
        const totalBudgetForMonth = budgets
          .filter((b) => {
            const startDate = new Date(b.start_date);
            const endDate = b.end_date ? new Date(b.end_date) : null;
            return (
              b.is_active &&
              b.frequency === "1m" &&
              startDate <= monthDate &&
              (!endDate || endDate >= monthDate)
            );
          })
          .reduce(
            (sum, b) =>
              sum +
              convertBetweenCurrencies(
                b.target_amount,
                b.currency,
                selectedCurrency,
              ),
            0,
          );

        return {
          month,
          ...values,
          budgetTarget: totalBudgetForMonth > 0 ? totalBudgetForMonth : null,
        };
      })
      .reverse();
  }, [transactions, budgets, selectedCurrency, convertBetweenCurrencies]);

  const { isFinancialPulse } = useTheme();

  return (
    <ThemedCard className="col-span-full">
      <ThemedCardHeader>
        <ThemedCardTitle>Trends and Analytics</ThemedCardTitle>
        <ThemedCardDescription>
          Monthly patterns in your spending and income.
        </ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="gradientIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke={isFinancialPulse ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
            />
            <XAxis
              dataKey="month"
              tick={{
                fill: isFinancialPulse ? "#94a3b8" : "#666",
                fontSize: 12,
              }}
              stroke={isFinancialPulse ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{
                fill: isFinancialPulse ? "#94a3b8" : "#666",
                fontSize: 12,
              }}
              stroke={isFinancialPulse ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: isFinancialPulse ? "rgba(0,0,0,0.8)" : "white",
                borderColor: isFinancialPulse
                  ? "rgba(255,255,255,0.1)"
                  : "#e5e7eb",
                color: isFinancialPulse ? "white" : "black",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#22c55e"
              fill="url(#gradientIncome)"
              fillOpacity={1}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#ef4444"
              fill="url(#gradientExpenses)"
              fillOpacity={1}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="budgetTarget"
              stroke="#ff7300"
              strokeWidth={2}
              name="Budget Target"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default TrendsAndAnalytics;
