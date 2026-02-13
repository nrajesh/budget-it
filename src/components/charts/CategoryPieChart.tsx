"use client";

import React, { useState, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ActivePieShape } from "./ActivePieShape";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { slugify } from "@/lib/utils";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28DFF",
  "#36A2EB",
  "#FFCE56",
  "#FF6384",
];

const CategoryPieChart = () => {
  const { formatCurrency } = useCurrency(); // Get formatCurrency from context
  const { transactions, categories, isLoadingTransactions } = useTransactions();
  const { setSelectedCategories, setSelectedVendors, handleResetFilters } =
    useTransactionFilters();
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined); // Local activeIndex for current view

  // Calculate category data from transactions in context
  const categoriesData = React.useMemo(() => {
    if (!transactions || !categories) return [];

    const categoryMap = new Map<string, number>();

    transactions.forEach((t) => {
      // Expenses only usually for pie chart? Or net?
      // Usually pie charts show Expenses.
      if (t.amount < 0 && t.category) {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + Math.abs(t.amount));
      }
    });

    return Array.from(categoryMap.entries())
      .map(([name, amount], index) => ({
        id: categories.find((c) => c.name === name)?.id || `cat-${index}`,
        name: name,
        total_amount: amount,
      }))
      .filter((c) => c.total_amount > 0)
      .sort((a, b) => b.total_amount - a.total_amount);
  }, [transactions, categories]);

  // Calculate drilldown data
  const drilledDownData = React.useMemo(() => {
    if (!selectedCategory || !transactions) return [];

    const vendorMap = new Map<string, number>();

    transactions
      .filter((t) => t.category === selectedCategory.name && t.amount < 0)
      .forEach((t) => {
        const vendor = t.vendor || "Unknown";
        const current = vendorMap.get(vendor) || 0;
        vendorMap.set(vendor, current + Math.abs(t.amount));
      });

    return Array.from(vendorMap.entries())
      .map(([name, amount]) => ({
        vendor_name: name,
        total_amount: amount,
      }))
      .sort((a, b) => b.total_amount - a.total_amount);
  }, [selectedCategory, transactions]);

  const chartData = selectedCategory ? drilledDownData : categoriesData;
  const isLoading = isLoadingTransactions;

  const onPieClick = useCallback(
    (data: any, index: number) => {
      if (!selectedCategory) {
        // If in top-level categories, set active index and drill down
        setActiveIndex(index);
        setSelectedCategory({ id: data.id, name: data.name });

        // Auto-filter Recent transactions by category
        const categorySlug = slugify(data.name);
        setSelectedCategories([categorySlug]);
      } else {
        // If drilled down, just toggle active index for the vendor
        setActiveIndex((prevIndex) =>
          prevIndex === index ? undefined : index,
        );

        // Auto-filter Recent transactions by vendor
        const vendorSlug = slugify(data.vendor_name);
        setSelectedVendors([vendorSlug]);
      }
    },
    [selectedCategory, setSelectedCategories, setSelectedVendors],
  );

  const handleBackClick = useCallback(() => {
    setSelectedCategory(null);
    setActiveIndex(undefined); // Clear active index when going back
    setSelectedVendors([]); // Clear vendor filter
  }, [setSelectedVendors]);

  const resetActiveIndex = useCallback(() => {
    setActiveIndex(undefined);
    handleResetFilters();
    setSelectedCategory(null);
  }, [handleResetFilters]);

  const renderActiveShape = useCallback(
    (props: any) => {
      return (
        <ActivePieShape
          {...props}
          formatCurrency={formatCurrency}
          onCenterClick={resetActiveIndex}
        />
      );
    },
    [formatCurrency, resetActiveIndex],
  );

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        Loading chart data...
      </div>
    );
  if (!chartData || chartData.length === 0)
    return <div className="text-center py-4">No data to display.</div>;

  const renderLabel = ({
    name,
    percent,
  }: {
    name: string;
    percent: number;
  }) => {
    return `${name} (${(percent * 100).toFixed(0)}%)`;
  };

  return (
    <Card className="w-full h-full mx-auto overflow-hidden shadow-lg border-slate-200">
      <CardHeader className="pb-2 border-b border-slate-50 bg-slate-50/50">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-bold text-slate-800">
            {selectedCategory ? (
              <Button
                variant="ghost"
                onClick={handleBackClick}
                className="flex items-center gap-2 px-2 hover:bg-slate-200/50 -ml-2"
              >
                <ArrowLeft className="h-4 w-4" /> {selectedCategory.name}
              </Button>
            ) : (
              "Spending by Category"
            )}
          </span>
          {!selectedCategory && (
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tap to drill down
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="w-full" style={{ height: "500px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                innerRadius={110}
                outerRadius={180}
                paddingAngle={5}
                fill="#8884d8"
                dataKey="total_amount"
                nameKey={selectedCategory ? "vendor_name" : "name"}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onClick={onPieClick}
                animationBegin={0}
                animationDuration={1000}
              >
                {chartData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryPieChart;
