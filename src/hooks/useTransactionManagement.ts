"use client";

import React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "./useCurrency";
import { useTransactionPagination } from "./transactions/useTransactionPagination";
import { useTransactionSelection } from "./transactions/useTransactionSelection";
import { Transaction } from "@/contexts/TransactionsContext"; // Import Transaction type

export const useTransactionManagement = () => {
  const { transactions: allTransactions, accountCurrencyMap, refetchTransactions } = useTransactions(); // Get refetchTransactions
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
    paginatedTransactions,
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
  } = useTransactionSelection(paginatedTransactions, allTransactions || []);

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
    paginatedTransactions,
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