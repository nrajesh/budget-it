"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell, Sector } from "recharts"; // Import Sector
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { ActivePieShape } from "./charts/ActivePieShape";
import { usePieChartInteraction } from "@/hooks/usePieChartInteraction";

interface SpendingCategoriesChartProps {
  transactions: Transaction[];
}

export function SpendingCategoriesChart({ transactions }: SpendingCategoriesChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const { categories: allCategories } = useTransactions();

  const [selectedCategoryForDrilldown, setSelectedCategoryForDrilldown] = React.useState<string | null>(null);
  const { activeIndex: categoryActiveIndex, handlePieClick: handleCategoryPieClick, resetActiveIndex: resetCategoryActiveIndex } = usePieChartInteraction();
  const { activeIndex: vendorActiveIndex, handlePieClick: handleVendorPieClick, resetActiveIndex: resetVendorActiveIndex } = usePieChartInteraction();

  // Data for initial category spending chart
  const categorySpendingData = React.useMemo(() => {
    const spending = transactions.reduce((acc, transaction) => {
      if (transaction.amount < 0 && transaction.category !== 'Transfer') {
        const category = transaction.category;
        const convertedAmount = convertBetweenCurrencies(Math.abs(transaction.amount), transaction.currency, selectedCurrency);
        acc[category] = (acc[category] || 0) + convertedAmount;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(spending).map(([category, amount], index) => ({
      category,
      amount: amount,
      fill: `hsl(var(--chart-${(index % 8) + 1}))`, // Assign colors dynamically
    }));
  }, [transactions, convertBetweenCurrencies, selectedCurrency]);

  // Data for vendor drill-down chart
  const vendorSpendingData = React.useMemo(() => {
    if (!selectedCategoryForDrilldown) return [];

    const filteredTransactions = transactions.filter(
      (t) => t.amount < 0 && t.category === selectedCategoryForDrilldown && t.category !== 'Transfer'
    );

    const vendorData = filteredTransactions.reduce((acc, transaction) => {
      const vendor = transaction.vendor || 'Unknown Vendor';
      const convertedAmount = convertBetweenCurrencies(Math.abs(transaction.amount), transaction.currency, selectedCurrency);
      acc[vendor] = (acc[vendor] || 0) + convertedAmount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(vendorData).map(([vendor, amount], index) => ({
      vendor,
      amount: amount,
      fill: `hsl(var(--chart-${(index % 8) + 1}))`,
    }));
  }, [transactions, selectedCategoryForDrilldown, convertBetweenCurrencies, selectedCurrency]);

  const currentChartData = selectedCategoryForDrilldown ? vendorSpendingData : categorySpendingData;
  const currentNameKey = selectedCategoryForDrilldown ? "vendor" : "category";
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

    // Add 'Other' for initial category view if not already present
    if (!selectedCategoryForDrilldown && !config['Other']) {
      config['Other'] = {
        label: "Other",
        color: "hsl(var(--chart-8))",
      };
    }
    return config;
  }, [currentChartData, selectedCategoryForDrilldown]);

  const handlePieSliceClick = (data: any, index: number) => {
    if (!selectedCategoryForDrilldown) {
      // Currently in category view, drill down
      const clickedCategory = data.category;
      setSelectedCategoryForDrilldown(clickedCategory);
      resetCategoryActiveIndex(); // Reset active index for category chart
      resetVendorActiveIndex(); // Ensure vendor chart has no active index initially
    } else {
      // Currently in vendor view, just activate/deactivate vendor slice
      handleVendorPieClick(index);
    }
  };

  const handleCenterClick = () => {
    setSelectedCategoryForDrilldown(null);
    resetCategoryActiveIndex();
    resetVendorActiveIndex();
  };

  const activeIndexForPie = selectedCategoryForDrilldown ? vendorActiveIndex : categoryActiveIndex;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="w-full text-center">
            {selectedCategoryForDrilldown ? `Spending in ${selectedCategoryForDrilldown}` : "Spending by Category"}
          </CardTitle>
        </div>
        <CardDescription>
          {selectedCategoryForDrilldown ? `Total for ${selectedCategoryForDrilldown}: ${formatCurrency(currentTotalSpending)}` : `Total spending: ${formatCurrency(currentTotalSpending)}`}
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
              activeIndex={activeIndexForPie}
              activeShape={(props) => activeIndexForPie !== null ? <ActivePieShape {...props} formatCurrency={formatCurrency} /> : null}
              onClick={(data, index) => handlePieSliceClick(data, index)}
            >
              {currentChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            {selectedCategoryForDrilldown && (
              // Transparent sector in the center to act as a back button
              <Sector
                cx={125} // Assuming center of the chart container
                cy={125} // Assuming center of the chart container
                innerRadius={0}
                outerRadius={60} // Matches innerRadius of the main pie
                startAngle={0}
                endAngle={360}
                fill="transparent"
                onClick={handleCenterClick}
                style={{ cursor: 'pointer' }}
              />
            )}
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}