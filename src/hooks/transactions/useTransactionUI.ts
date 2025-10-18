"use client";

import React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { toast } from "sonner";

export const useTransactionUI = () => {
  const { refetchTransactions } = useTransactions();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchTransactions();
      toast.success("Transactions refreshed!");
    } catch (error) {
      toast.error("Failed to refresh transactions.");
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    handleRefresh,
  };
};