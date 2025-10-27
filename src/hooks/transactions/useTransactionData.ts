"use client";

import { useMemo } from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { generateFutureTransactions } from '@/lib/transaction-utils';
import { useScheduledTransactions } from './useScheduledTransactions';

export const useTransactionData = () => {
  const {
    transactions,
    accounts,
    vendors,
    categories,
    accountCurrencyMap,
    isLoading: isLoadingTransactions,
    error,
    refetchTransactions,
  } = useTransactions();

  const { scheduledTransactions, isLoading: isLoadingScheduled } = useScheduledTransactions(refetchTransactions);

  const combinedTransactions = useMemo(() => {
    const past = transactions || [];
    const future = generateFutureTransactions(scheduledTransactions || [], accountCurrencyMap);
    return [...past, ...future].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, scheduledTransactions, accountCurrencyMap]);

  return {
    combinedTransactions,
    isLoading: isLoadingTransactions || isLoadingScheduled,
    error,
    accounts,
    vendors,
    categories,
    accountCurrencyMap,
  };
};