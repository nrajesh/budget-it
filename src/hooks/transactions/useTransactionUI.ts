import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";

export const useTransactionUI = () => {
  const { refetchTransactions } = useTransactions();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await refetchTransactions();
    setIsRefreshing(false);
  }, [refetchTransactions]);

  return {
    isRefreshing,
    handleRefresh,
  };
};
