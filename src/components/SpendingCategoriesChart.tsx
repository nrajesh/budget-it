"use client";

import React from "react";
import { ThemedCard, ThemedCardContent, ThemedCardDescription, ThemedCardHeader, ThemedCardTitle } from "@/components/ThemedCard";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePieChartInteraction } from "@/hooks/usePieChartInteraction";
import { ActivePieShape } from "./charts/ActivePieShape"; // Added this import

// Helper function to process transactions into chart data
interface ChartDataItem {
  name: string;
  amount: number;
  fill: string;
}

function processTransactionsForChart(
  transactions: Transaction[],
  selectedCurrency: string,
  convertBetweenCurrencies: (amount: number, from: string, to: string) => number,
  filterCategory?: string
): ChartDataItem[] {
  const spending = transactions.reduce((acc, transaction) => {
    if (transaction.amount < 0 && transaction.category !== 'Transfer') {
      if (filterCategory && transaction.category !== filterCategory) {
        return acc;
      }

      const key = filterCategory ? (transaction.vendor || 'Unknown Vendor') : transaction.category;
      const convertedAmount = convertBetweenCurrencies(Math.abs(transaction.amount), transaction.currency, selectedCurrency);
      acc[key] = (acc[key] || 0) + convertedAmount;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(spending).map(([name, amount], index) => ({
    name,
    amount: amount,
    fill: `hsl(var(--chart-${(index % 8) + 1}))`, // Assign colors dynamically
  }));
}

interface SpendingCategoriesChartProps {
  transactions: Transaction[];
}

export function SpendingCategoriesChart({ transactions }: SpendingCategoriesChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();

  const [selectedCategoryForDrilldown, setSelectedCategoryForDrilldown] = React.useState<string | null>(null);
  const { activeIndex: categoryActiveIndex, handlePieClick: handleCategoryPieClick, resetActiveIndex: resetCategoryActiveIndex } = usePieChartInteraction();
  const { activeIndex: vendorActiveIndex, handlePieClick: handleVendorPieClick, resetActiveIndex: resetVendorActiveIndex } = usePieChartInteraction();

  const categorySpendingData = React.useMemo(() => {
    return processTransactionsForChart(transactions, selectedCurrency, convertBetweenCurrencies);
  }, [transactions, selectedCurrency, convertBetweenCurrencies]);

  const vendorSpendingData = React.useMemo(() => {
    if (!selectedCategoryForDrilldown) return [];
    return processTransactionsForChart(transactions, selectedCurrency, convertBetweenCurrencies, selectedCategoryForDrilldown);
  }, [transactions, selectedCurrency, convertBetweenCurrencies, selectedCategoryForDrilldown]);

  const currentChartData = selectedCategoryForDrilldown ? vendorSpendingData : categorySpendingData;
  const currentNameKey = selectedCategoryForDrilldown ? "name" : "name"; // Both use 'name' now
  const currentTotalSpending = currentChartData.reduce((sum, item) => sum + item.amount, 0);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      amount: {
        label: "Amount",
      },
    };

    currentChartData.forEach((item) => {
      // Use item.name directly as the key for chartConfig
      config[item.name] = {
        label: item.name,
        color: item.fill,
      };
    });

    return config;
  }, [currentChartData]);

  const handlePieSliceClick = (data: ChartDataItem, index: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event from bubbling up to ChartContainer
    if (!selectedCategoryForDrilldown) {
      // Currently in category view, drill down
      const clickedCategory = data.name;
      setSelectedCategoryForDrilldown(clickedCategory);
      resetCategoryActiveIndex(); // Reset active index for category chart
      resetVendorActiveIndex(); // Ensure vendor chart has no active index initially
    } else {
      // Currently in vendor view, just activate/deactivate vendor slice
      handleVendorPieClick(index);
    }
  };

  const handleGoBackToCategories = () => {
    if (selectedCategoryForDrilldown) {
      setSelectedCategoryForDrilldown(null);
      resetCategoryActiveIndex();
      resetVendorActiveIndex();
    }
  };

  const activeIndexForPie = selectedCategoryForDrilldown ? vendorActiveIndex : categoryActiveIndex;

  return (
    <ThemedCard className="flex flex-col h-full">
      <ThemedCardHeader className="items-center pb-0">
        <div className="flex items-center justify-between w-full">
          <ThemedCardTitle className="w-full text-center">
            {selectedCategoryForDrilldown ? `Spending in ${selectedCategoryForDrilldown}` : "Spending by Category"}
          </ThemedCardTitle>
        </div>
        <ThemedCardDescription>
          {selectedCategoryForDrilldown ? `Total for ${selectedCategoryForDrilldown}: ${formatCurrency(currentTotalSpending)}` : `Total spending: ${formatCurrency(currentTotalSpending)}`}
        </ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
          onClick={handleGoBackToCategories} // Click anywhere in container to go back
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
              activeIndex={activeIndexForPie}
              activeShape={(props) => activeIndexForPie !== null ? <ActivePieShape {...props} formatCurrency={formatCurrency} /> : null}
              onClick={(data, index, event) => handlePieSliceClick(data as ChartDataItem, index, event)}
            >
              {currentChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </ThemedCardContent>
    </ThemedCard>
  );
}