"use client";

import React, { useState, useCallback } from "react";
import { ThemedCard, ThemedCardContent, ThemedCardHeader, ThemedCardTitle, ThemedCardDescription } from "@/components/ThemedCard";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ActivePieShape } from "./charts/ActivePieShape";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#36A2EB', '#FFCE56', '#FF6384'];

interface SpendingCategoriesChartProps {
  transactions: Transaction[];
}

export function SpendingCategoriesChart({ transactions }: SpendingCategoriesChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const { setSelectedCategories, setSelectedSubCategories, handleResetFilters, selectedAccounts } = useTransactionFilters();

  const [selectedCategory, setSelectedCategory] = useState<{ name: string } | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Apply account filter to the passed transactions (if not already applied in Analytics.tsx)
  const accountFilteredTransactions = React.useMemo(() => {
    if (selectedAccounts.length === 0) return transactions;
    return transactions.filter(t => selectedAccounts.includes(slugify(t.account)));
  }, [transactions, selectedAccounts]);

  // Calculate category data
  const categoriesData = React.useMemo(() => {
    const categoryMap = new Map<string, number>();

    accountFilteredTransactions.forEach(t => {
      if (t.amount < 0 && t.category && t.category !== 'Transfer') {
        const convertedAmount = convertBetweenCurrencies(Math.abs(t.amount), t.currency, selectedCurrency);
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + convertedAmount);
      }
    });

    return Array.from(categoryMap.entries())
      .map(([name, amount]) => ({
        name,
        amount
      }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [accountFilteredTransactions, convertBetweenCurrencies, selectedCurrency]);

  // Calculate sub-category drilldown data
  const subCategoryData = React.useMemo(() => {
    if (!selectedCategory) return [];

    const subCatMap = new Map<string, number>();

    accountFilteredTransactions
      .filter(t => t.category === selectedCategory.name && t.amount < 0)
      .forEach(t => {
        const subCat = t.sub_category || "Uncategorized";
        const convertedAmount = convertBetweenCurrencies(Math.abs(t.amount), t.currency, selectedCurrency);
        const current = subCatMap.get(subCat) || 0;
        subCatMap.set(subCat, current + convertedAmount);
      });

    return Array.from(subCatMap.entries())
      .map(([name, amount]) => ({
        name,
        amount
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [selectedCategory, accountFilteredTransactions, convertBetweenCurrencies, selectedCurrency]);

  const currentData = selectedCategory ? subCategoryData : categoriesData;

  const onPieClick = useCallback((data: any, index: number) => {
    if (!selectedCategory) {
      setActiveIndex(index);
      setSelectedCategory({ name: data.name });

      // Sync with global filters
      setSelectedCategories([slugify(data.name)]);
      setSelectedSubCategories([]); // Clear sub-categories when drilling into a new category
    } else {
      setActiveIndex(prevIndex => (prevIndex === index ? undefined : index));

      // Sync with global filters
      const subCatSlug = data.name === "Uncategorized" ? "uncategorized" : slugify(data.name);
      setSelectedSubCategories([subCatSlug]);
    }
  }, [selectedCategory, setSelectedCategories, setSelectedSubCategories]);

  const handleBackToCategories = useCallback(() => {
    setSelectedCategory(null);
    setActiveIndex(undefined);
    setSelectedSubCategories([]); // Clear sub-category filter when going back
  }, [setSelectedSubCategories]);

  const resetAll = useCallback(() => {
    setSelectedCategory(null);
    setActiveIndex(undefined);
    handleResetFilters();
  }, [handleResetFilters]);

  const renderActiveShape = useCallback((props: any) => {
    return <ActivePieShape {...props} formatCurrency={formatCurrency} onCenterClick={resetAll} />;
  }, [formatCurrency, resetAll]);

  if (categoriesData.length === 0) {
    return (
      <ThemedCard className="flex flex-col h-full">
        <ThemedCardHeader className="flex flex-row items-center justify-between space-y-0 border-b p-6">
          <div className="flex flex-col space-y-1.5">
            <ThemedCardTitle>Spending by Category</ThemedCardTitle>
          </div>
        </ThemedCardHeader>
        <ThemedCardContent className="flex items-center justify-center h-64 text-muted-foreground">
          No spending data for this period
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  return (
    <ThemedCard className="flex flex-col h-full">
      <ThemedCardHeader className="flex flex-row items-center justify-between space-y-0 border-b p-6">
        <div className="flex flex-col space-y-1.5">
          <ThemedCardTitle className="flex items-center gap-2">
            {selectedCategory ? (
              <Button
                variant="ghost"
                onClick={handleBackToCategories}
                className="flex items-center gap-2 px-2 -ml-2 h-auto font-semibold hover:bg-transparent hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" /> {selectedCategory.name}
              </Button>
            ) : (
              "Spending by Category"
            )}
          </ThemedCardTitle>
          {!selectedCategory && (
            <ThemedCardDescription>
              TAP TO DRILL DOWN
            </ThemedCardDescription>
          )}
        </div>
      </ThemedCardHeader>
      <ThemedCardContent className="pt-6 flex-1">
        <div className="w-full h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={65}
                outerRadius={105}
                paddingAngle={4}
                fill="#8884d8"
                dataKey="amount"
                nameKey="name"
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onClick={onPieClick}
                animationDuration={800}
              >
                {currentData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}