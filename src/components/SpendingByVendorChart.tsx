"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ActivePieShape } from "./charts/ActivePieShape";
import { usePieChartInteraction } from "@/hooks/usePieChartInteraction";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface SpendingByVendorChartProps {
  transactions: Transaction[];
}

export function SpendingByVendorChart({ transactions }: SpendingByVendorChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const { activeIndex, handlePieClick, resetDrilldown, selectedDrilldownItem } = usePieChartInteraction();

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

  // Data for category drill-down chart (when a vendor is selected)
  const categorySpendingData = React.useMemo(() => {
    if (!selectedDrilldownItem) return [];

    const filteredTransactions = transactions.filter(
      (t) => t.amount < 0 && t.vendor === selectedDrilldownItem && t.category !== 'Transfer'
    );

    const categoryData = filteredTransactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Unknown Category';
      const convertedAmount = convertBetweenCurrencies(Math.abs(transaction.amount), transaction.currency, selectedCurrency);
      acc[category] = (acc[category] || 0) + convertedAmount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryData).map(([category, amount], index) => ({
      category,
      amount: amount,
      fill: `hsl(var(--chart-${(index % 8) + 1}))`,
    }));
  }, [transactions, selectedDrilldownItem, convertBetweenCurrencies, selectedCurrency]);

  const currentChartData = selectedDrilldownItem ? categorySpendingData : vendorSpendingData;
  const currentNameKey = selectedDrilldownItem ? "category" : "vendor";
  const currentTotalSpending = currentChartData.reduce((sum, item) => sum + item.amount, 0);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      amount: {
        label: "Amount",
      },
    };

    currentChartData.forEach((item, index) => {
      const name = item.category || item.vendor;
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
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <div className="flex items-center justify-between w-full">
          {selectedDrilldownItem && (
            <Button variant="ghost" size="icon" onClick={resetDrilldown} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          )}
          <CardTitle className={selectedDrilldownItem ? "ml-auto" : ""}>
            {selectedDrilldownItem ? `Spending with ${selectedDrilldownItem}` : "Spending by Vendor"}
          </CardTitle>
          {selectedDrilldownItem && <div className="w-8"></div> /* Spacer for alignment */}
        </div>
        <CardDescription>
          {selectedDrilldownItem ? `Total for ${selectedDrilldownItem}: ${formatCurrency(currentTotalSpending)}` : `Total spending: ${formatCurrency(currentTotalSpending)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
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
              onClick={(data, index) => handlePieClick(data, index, currentNameKey)}
            >
              {currentChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}