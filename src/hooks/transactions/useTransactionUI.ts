import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";

export const useTransactionUI = () => {
  const { fetchTransactions } = useTransactions();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await fetchTransactions();
    setIsRefreshing(false);
  }, [fetchTransactions]);

  return {
    isRefreshing,
    handleRefresh,
  };
};