"use client";

import { useMemo } from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { generateFutureTransactions } from '@/lib/transaction-utils';
import { useScheduledTransactions } from './useScheduledTransactions';
import { Transaction } from '@/types/finance';

export const useTransactionData = (filters: any) => {
  const {
    transactions,
    accounts,
    vendors,
    categories,
    accountCurrencyMap,
    isLoadingTransactions,
    error,
    refetchTransactions,
  } = useTransactions();

  const { scheduledTransactions, isLoading: isLoadingScheduled } = useScheduledTransactions(refetchTransactions);

  const combinedTransactions = useMemo(() => {
    const past = transactions || [];
    const future = generateFutureTransactions(scheduledTransactions || [], accountCurrencyMap);
    return [...past, ...future].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, scheduledTransactions, accountCurrencyMap]);

  const filteredTransactions = useMemo(() => {
    // Placeholder for actual filtering logic based on filters object
    return combinedTransactions;
  }, [combinedTransactions, filters]);

  return {
    filteredTransactions,
    combinedTransactions,
    isLoading: isLoadingTransactions || isLoadingScheduled,
    error,
    accounts,
    vendors,
    categories,
  };
};