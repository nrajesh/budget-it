"use client";

import { useId, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import {
  format,
  differenceInDays,
  startOfMonth,
  startOfWeek,
  addDays,
  addWeeks,
  addMonths,
  isBefore,
} from "date-fns";
import { type PeriodRange, type PeriodType } from "@/hooks/useAnalyticsPeriod";

interface SpendingBarChartProps {
  currentTransactions: Transaction[];
  currentRange: PeriodRange;
  period: PeriodType;
}

interface BarDataPoint {
  label: string;
  amount: number;
}

function buildBarData(
  transactions: Transaction[],
  range: PeriodRange,
  period: PeriodType,
): BarDataPoint[] {
  const totalDays = differenceInDays(range.to, range.from) + 1;
  const spendingTxs = transactions.filter(
    (t) => t.amount < 0 && t.category !== "Transfer",
  );

  // Group into buckets based on period type
  if (period === "1W" || (period === "custom" && totalDays <= 14)) {
    // Daily bars
    const dailyMap = new Map<string, number>();
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(range.from, i);
      const key = format(date, totalDays <= 7 ? "EEE" : "d MMM");
      dailyMap.set(key, 0);
    }

    spendingTxs.forEach((t) => {
      const txDate = new Date(t.date);
      txDate.setHours(0, 0, 0, 0);
      const key = format(txDate, totalDays <= 7 ? "EEE" : "d MMM");
      if (dailyMap.has(key)) {
        dailyMap.set(key, (dailyMap.get(key) || 0) + Math.abs(t.amount));
      }
    });

    return Array.from(dailyMap.entries()).map(([label, amount]) => ({
      label,
      amount,
    }));
  }

  if (
    period === "1M" ||
    (period === "custom" && totalDays > 14 && totalDays <= 60)
  ) {
    // Weekly bars
    const weeklyData: BarDataPoint[] = [];
    let weekStart = startOfWeek(range.from, { weekStartsOn: 1 });
    if (isBefore(weekStart, range.from)) weekStart = range.from;

    while (isBefore(weekStart, range.to)) {
      const weekEnd = addDays(addWeeks(weekStart, 1), -1);
      const label = format(weekStart, "d MMM");
      const weekSpending = spendingTxs
        .filter((t) => {
          const txDate = new Date(t.date);
          txDate.setHours(0, 0, 0, 0);
          return txDate >= weekStart && txDate <= weekEnd;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      weeklyData.push({ label, amount: weekSpending });
      weekStart = addWeeks(weekStart, 1);
    }

    return weeklyData;
  }

  // 6M, 1Y, or long custom: monthly bars
  const monthlyData: BarDataPoint[] = [];
  let monthStart = startOfMonth(range.from);

  while (isBefore(monthStart, range.to)) {
    const monthEnd = addDays(addMonths(monthStart, 1), -1);
    const label = format(monthStart, "MMM");
    const monthSpending = spendingTxs
      .filter((t) => {
        const txDate = new Date(t.date);
        txDate.setHours(0, 0, 0, 0);
        return txDate >= monthStart && txDate <= monthEnd;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    monthlyData.push({ label, amount: monthSpending });
    monthStart = addMonths(monthStart, 1);
  }

  return monthlyData;
}

export function SpendingBarChart({
  currentTransactions,
  currentRange,
  period,
}: SpendingBarChartProps) {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();
  const barGradientId = useId().replace(/:/g, "");
  const tickColor = "hsl(var(--analytics-axis))";
  const gridColor = "hsl(var(--analytics-grid))";
  const barColor = `url(#${barGradientId})`;
  const secondaryColor = "hsl(var(--foreground))";
  const barStrokeColor = secondaryColor;
  const maxLineColor = secondaryColor;
  const meanLineColor = secondaryColor;

  const barData = useMemo(
    () => buildBarData(currentTransactions, currentRange, period),
    [currentTransactions, currentRange, period],
  );

  const { meanValue, maxValue, avgLabel } = useMemo(() => {
    let total = 0;
    let max = 0;
    let count = 0;

    for (let i = 0; i < barData.length; i++) {
      const amount = barData[i].amount;
      if (amount > 0) {
        total += amount;
        if (amount > max) max = amount;
        count++;
      }
    }

    if (count === 0) return { meanValue: 0, maxValue: 0, avgLabel: "" };

    const mean = total / count;

    // Determine label for the avg
    let periodUnit = t("analytics.chart.avgPerPeriod", {
      defaultValue: "per period",
    });
    if (period === "6M" || period === "1Y")
      periodUnit = t("analytics.chart.avgPerMonth", {
        defaultValue: "avg. per month",
      });
    else if (period === "1M")
      periodUnit = t("analytics.chart.avgPerWeek", {
        defaultValue: "avg. per week",
      });
    else if (period === "1W")
      periodUnit = t("analytics.chart.avgPerDay", {
        defaultValue: "avg. per day",
      });

    return {
      meanValue: mean,
      maxValue: max,
      avgLabel: `${formatCurrency(mean)} ${periodUnit}`,
    };
  }, [barData, period, formatCurrency, t]);

  const yMax = useMemo(() => Math.max(maxValue, 1) * 1.15, [maxValue]);

  if (barData.every((d) => d.amount === 0)) {
    return (
      <div className="w-full h-[220px] sm:h-[260px] flex items-center justify-center text-muted-foreground text-sm">
        {t("analytics.chart.noData", {
          defaultValue: "No spending data for this period",
        })}
      </div>
    );
  }

  return (
    <div className="w-full">
      {avgLabel && (
        <p className="app-accent-text mb-2 px-1 text-xs font-medium">
          📊 {avgLabel}
        </p>
      )}
      <div className="h-[200px] sm:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barData}
            margin={{ top: 5, right: 18, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id={barGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--analytics-bar-from))" />
                <stop offset="100%" stopColor="hsl(var(--analytics-bar-to))" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 11 }}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 11 }}
              tickFormatter={(v) => {
                if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
                return String(Math.round(v));
              }}
              width={50}
              domain={[0, yMax]}
            />
            <Tooltip
              formatter={(value: unknown) => [
                formatCurrency(value as number),
                t("analytics.chart.spending", { defaultValue: "Spending" }),
              ]}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                fontSize: "11px",
                lineHeight: "1.2",
              }}
              labelStyle={{ fontSize: "11px", marginBottom: "2px" }}
              itemStyle={{ fontSize: "11px", paddingTop: 0, paddingBottom: 0 }}
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            />

            {/* Max dotted line */}
            {maxValue > 0 && (
              <ReferenceLine
                y={maxValue}
                stroke={maxLineColor}
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: t("analytics.chart.max", { defaultValue: "max" }),
                  position: "insideTopRight",
                  fill: maxLineColor,
                  fontSize: 10,
                  dx: -8,
                  dy: -2,
                }}
              />
            )}

            {/* Mean dotted line */}
            {meanValue > 0 && (
              <ReferenceLine
                y={meanValue}
                stroke={meanLineColor}
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{
                  value: t("analytics.chart.mean", { defaultValue: "mean" }),
                  position: "insideTopRight",
                  fill: meanLineColor,
                  fontSize: 10,
                  dx: -8,
                  dy: 10,
                }}
              />
            )}

            <Bar
              dataKey="amount"
              fill={barColor}
              stroke={barStrokeColor}
              strokeOpacity={0.55}
              strokeWidth={1.25}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
