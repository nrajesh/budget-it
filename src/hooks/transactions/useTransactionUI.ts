import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';

export const useTransactionUI = () => {
  const { refetchTransactions } = useTransactions();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchTransactions();
    } finally {
      setIsRefreshing(false);
    }
  };

  return { isRefreshing, handleRefresh };
};