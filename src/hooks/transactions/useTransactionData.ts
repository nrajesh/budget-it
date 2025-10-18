"use client";

import React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useUser } from "@/hooks/useUser";
import { useCurrency } from "@/hooks/useCurrency";
import { Transaction } from "@/contexts/TransactionsContext"; // Import Transaction type

interface UseTransactionDataProps {
  dateRange?: { from?: Date; to?: Date };
  selectedAccount?: string;
  selectedCategory?: string;
  selectedVendor?: string;
  searchTerm?: string;
}

export const useTransactionData = ({
  dateRange,
  selectedAccount,
  selectedCategory,
  selectedVendor,
  searchTerm,
}: UseTransactionDataProps) => {
  const { transactions, accountCurrencyMap, refetchTransactions: refetchMainTransactions } = useTransactions();
  const { user, isLoadingUser } = useUser();
  const { selectedCurrency, convertBetweenCurrencies } = useCurrency();

  const filteredTransactions = React.useMemo(() => {
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
    if (searchTerm) {
      filtered = filtered.filter(
        t =>
          t.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.map(t => ({
      ...t,
      amount: convertBetweenCurrencies(t.amount, t.currency, selectedCurrency, accountCurrencyMap)
    }));
  }, [transactions, dateRange, selectedAccount, selectedCategory, selectedVendor, searchTerm, selectedCurrency, accountCurrencyMap, convertBetweenCurrencies]);

  return {
    transactions: filteredTransactions,
    refetchTransactions: refetchMainTransactions,
    isLoadingUser,
    user,
  };
};