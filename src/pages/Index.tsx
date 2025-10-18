"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTransactions, Transaction } from "@/contexts/TransactionsContext"; // Import Transaction type from context
import { useCurrency } from "@/hooks/useCurrency";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { RecentTransactions } from "@/components/RecentTransactions";
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { SpendingByVendorChart } from "@/components/SpendingByVendorChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components

const Index = () => {
  const {
    transactions,
    isLoadingTransactions,
    handleRefresh,
    dateRange,
    setDateRange,
    selectedCategory,
    setSelectedCategory,
    categories,
    isLoadingCategories,
  } = useTransactions();
  const { selectedCurrency, formatCurrency, convertBetweenCurrencies, accountCurrencyMap } = useCurrency();

  const [selectedChartCategories, setSelectedChartCategories] = useState<string[]>([]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    let filtered = transactions;

    if (dateRange?.from) {
      filtered = filtered.filter(t => new Date(t.date) >= dateRange.from!);
    }
    if (dateRange?.to) {
      filtered = filtered.filter(t => new Date(t.date) <= dateRange.to!);
    }
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    return filtered.map(t => ({
      ...t,
      amount: convertBetweenCurrencies(t.amount, t.currency, selectedCurrency, accountCurrencyMap)
    }));
  }, [transactions, dateRange, selectedCategory, selectedCurrency, accountCurrencyMap, convertBetweenCurrencies]);

  const totalSpending = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Overview</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end mb-4">
          <div>
            <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <DatePickerWithRange
              id="date-range"
              date={dateRange}
              setDate={setDateRange}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger id="category-filter" className="w-full">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCategories ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  categories?.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-medium">Total Spending: {formatCurrency(totalSpending, selectedCurrency)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="lg:col-span-1">
          <SpendingCategoriesChart transactions={filteredTransactions} />
        </div>
        <div className="lg:col-span-1">
          <SpendingByVendorChart transactions={filteredTransactions} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        {isLoadingTransactions ? (
          <p>Loading recent transactions...</p>
        ) : (
          <RecentTransactions transactions={filteredTransactions} selectedCategories={selectedChartCategories} />
        )}
      </div>
    </div>
  );
};

export default Index;