"use client";

import React from "react";
import { useTransactions, Transaction } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/hooks/useCurrency"; // Corrected import path
import { useTransactionPagination } from "./transactions/useTransactionPagination";
import { useTransactionSelection } from "./transactions/useTransactionSelection";

export const useTransactionManagement = () => {
  const { transactions: allTransactions, accountCurrencyMap, refetchTransactions } = useTransactions();
  const { formatCurrency } = useCurrency();

  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] = React.useState(false);
  const [isEditTransactionDialogOpen, setIsEditTransactionDialogOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setIsAddTransactionDialogOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditTransactionDialogOpen(true);
  };

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    currentTransactions, // Changed from paginatedTransactions
    totalPages,
    totalItems,
  } = useTransactionPagination(allTransactions || []);

  const {
    selectedTransactionIds,
    toggleTransactionSelection,
    toggleAllTransactionsSelection,
    clearSelection,
    handleDeleteSelected,
    isAllSelected,
    isAnySelected,
  } = useTransactionSelection(currentTransactions, allTransactions || []); // Use currentTransactions here

  return {
    allTransactions,
    refetchTransactions,
    formatCurrency,
    accountCurrencyMap,
    isAddTransactionDialogOpen,
    setIsAddTransactionDialogOpen,
    isEditTransactionDialogOpen,
    setIsEditTransactionDialogOpen,
    selectedTransaction,
    setSelectedTransaction,
    handleAddTransaction,
    handleEditTransaction,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    paginatedTransactions: currentTransactions, // Export as paginatedTransactions for compatibility
    totalPages,
    totalItems,
    selectedTransactionIds,
    toggleTransactionSelection,
    toggleAllTransactionsSelection,
    clearSelection,
    handleDeleteSelected,
    isAllSelected,
    isAnySelected,
  };
};