"use client";

import React, { useState, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/hooks/useCurrency";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Transaction } from "@/contexts/TransactionsContext"; // Import Transaction type

interface ReportLayoutContextType {
  filteredTransactions: Transaction[];
  isLoadingTransactions: boolean;
  selectedCurrency: string;
  formatCurrency: (amount: number, currency: string) => string;
  convertBetweenCurrencies: (amount: number, from: string, to: string, rates: Record<string, string>) => number;
  accountCurrencyMap: Record<string, string>;
}

export const ReportLayoutContext = React.createContext<ReportLayoutContextType | undefined>(undefined);

const ReportLayout = () => {
  const {
    transactions,
    isLoadingTransactions,
    handleRefresh,
    dateRange,
    setDateRange,
    selectedAccount,
    setSelectedAccount,
    selectedCategory,
    setSelectedCategory,
    selectedVendor,
    setSelectedVendor,
    accounts,
    categories,
    vendors,
    isLoadingAccounts,
    isLoadingCategories,
    isLoadingVendors,
  } = useTransactions();
  const { selectedCurrency, formatCurrency, convertBetweenCurrencies, accountCurrencyMap } = useCurrency();

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    let filtered = transactions;

    if (dateRange?.from) {
      filtered = filtered.filter(t => new Date(t.date) >= dateRange.from!);
    }
    if (dateRange?.to) {
      filtered = filtered.filter(t => new Date(t.date) <= dateRange.to!);
    }
    if (selectedAccount) {
      filtered = filtered.filter(t => t.account === selectedAccount);
    }
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    if (selectedVendor) {
      filtered = filtered.filter(t => t.vendor === selectedVendor);
    }

    return filtered.map(t => ({
      ...t,
      amount: convertBetweenCurrencies(t.amount, t.currency, selectedCurrency, accountCurrencyMap)
    }));
  }, [transactions, dateRange, selectedAccount, selectedCategory, selectedVendor, selectedCurrency, accountCurrencyMap, convertBetweenCurrencies]);

  const dataProps = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    const historical = filteredTransactions.filter(t => new Date(t.date) <= today);
    const future = filteredTransactions.filter(t => new Date(t.date) > today && t.is_scheduled_origin);
    return { historicalFilteredTransactions: historical, futureFilteredTransactions: future };
  }, [filteredTransactions]);

  const contextValue = useMemo(() => ({
    filteredTransactions,
    isLoadingTransactions,
    selectedCurrency,
    formatCurrency,
    convertBetweenCurrencies,
    accountCurrencyMap,
    ...dataProps, // Spread historical and future transactions
  }), [filteredTransactions, isLoadingTransactions, selectedCurrency, formatCurrency, convertBetweenCurrencies, accountCurrencyMap, dataProps]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Filter Reports</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end mb-4">
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
            <label htmlFor="account-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Account
            </label>
            <Select
              value={selectedAccount}
              onValueChange={setSelectedAccount}
            >
              <SelectTrigger id="account-filter" className="w-full">
                <SelectValue placeholder="Filter by Account" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAccounts ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.name}>
                      {account.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
          <div>
            <label htmlFor="vendor-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Vendor
            </label>
            <Select
              value={selectedVendor}
              onValueChange={setSelectedVendor}
            >
              <SelectTrigger id="vendor-filter" className="w-full">
                <SelectValue placeholder="Filter by Vendor" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingVendors ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  vendors?.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.name}>
                      {vendor.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ReportLayoutContext.Provider value={contextValue}>
        <Outlet />
      </ReportLayoutContext.Provider>
    </div>
  );
};

export default ReportLayout;