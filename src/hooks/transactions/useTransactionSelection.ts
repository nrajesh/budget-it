"use client";

import React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Transaction } from "@/contexts/TransactionsContext"; // Import Transaction type

export const useTransactionSelection = (currentTransactions: Transaction[], allTransactions: Transaction[]) => {
  const { deleteMultipleTransactions } = useTransactions();
  const [selectedTransactionIds, setSelectedTransactionIds] = React.useState<string[]>([]);

  const toggleTransactionSelection = (id: string) => {
    setSelectedTransactionIds((prev) =>
      prev.includes(id) ? prev.filter((_id) => _id !== id) : [...prev, id]
    );
  };

  const toggleAllTransactionsSelection = () => {
    if (selectedTransactionIds.length === currentTransactions.length) {
      setSelectedTransactionIds([]);
    } else {
      setSelectedTransactionIds(currentTransactions.map((t) => t.id));
    }
  };

  const clearSelection = () => {
    setSelectedTransactionIds([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedTransactionIds.length > 0) {
      await deleteMultipleTransactions(selectedTransactionIds);
      clearSelection();
    }
  };

  const isAllSelected =
    currentTransactions.length > 0 &&
    selectedTransactionIds.length === currentTransactions.length;
  const isAnySelected = selectedTransactionIds.length > 0;

  return {
    selectedTransactionIds,
    toggleTransactionSelection,
    toggleAllTransactionsSelection,
    clearSelection,
    handleDeleteSelected,
    isAllSelected,
    isAnySelected,
  };
};