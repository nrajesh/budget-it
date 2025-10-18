"use client";

import React from "react";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"; // Removed Card imports
import { Pie, PieChart, Cell } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ActivePieShape } from "./charts/ActivePieShape";
import { usePieChartInteraction } from "@/hooks/usePieChartInteraction";

interface SpendingByVendorChartProps {
  transactions: Transaction[];
}

export function SpendingByVendorChart({ transactions }: SpendingByVendorChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const { activeIndex, handlePieClick } = usePieChartInteraction();

  // Data for initial vendor spending chart
  const vendorSpendingData = React.useMemo(() => {
    const spending = transactions.reduce((acc, transaction) => {
      if (transaction.amount < 0 && transaction.category !== 'Transfer') {
        const vendor = transaction.vendor || 'Unknown Vendor';
        const convertedAmount = convertBetweenCurrencies(Math.abs(transaction.amount), transaction.currency, selectedCurrency);
        acc[vendor] = (acc[vendor] || 0) + convertedAmount;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(spending).map(([vendor, amount], index) => ({
      vendor,
      amount: amount,
      fill: `hsl(var(--chart-${(index % 8) + 1}))`, // Assign colors dynamically
    }));
  }, [transactions, convertBetweenCurrencies, selectedCurrency]);

  const currentChartData = vendorSpendingData;
  const currentNameKey = "vendor";
  const currentTotalSpending = currentChartData.reduce((sum, item) => sum + item.amount, 0);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      amount: {
        label: "Amount",
      },
    };

    currentChartData.forEach((item, index) => {
      const name = item.vendor;
      const colorIndex = (index % 8) + 1;
      if (name) {
        config[name] = {
          label: name,
          color: `hsl(var(--chart-${colorIndex}))`,
        };
      }
    });

    return config;
  }, [currentChartData]);

  return (
    <div className="flex flex-col h-full rounded-lg border bg-card text-card-foreground shadow-sm"> {/* Replaced Card with div, added card styling */}
      <div className="flex flex-col space-y-1.5 p-6 items-center pb-0"> {/* Replaced CardHeader with div */}
        <div className="flex items-center justify-between w-full">
          <h2 className="w-full text-center text-2xl font-semibold leading-none tracking-tight"> {/* Replaced CardTitle with h2 */}
            Spending by Vendor
          </h2>
        </div>
        <p className="text-sm text-muted-foreground"> {/* Replaced CardDescription with p */}
          Total spending: {formatCurrency(currentTotalSpending)}
        </p>
      </div>
      <div className="flex-1 p-6 pt-0"> {/* Replaced CardContent with div */}
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel formatter={(value, name) => `${name}: ${formatCurrency(Number(value))}`} />}
            />
            <Pie
              data={currentChartData}
              dataKey="amount"
              nameKey={currentNameKey}
              innerRadius={60}
              outerRadius={80}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={(props) => activeIndex !== null ? <ActivePieShape {...props} formatCurrency={formatCurrency} /> : null}
              onClick={(data, index) => handlePieClick(index)}
            >
              {currentChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  );
}