"use client";

import { useState } from 'react';
import { Transaction } from '@/types/finance';
import { useTransactions } from '@/contexts/TransactionsContext';

export const useTransactionSelection = (pageTransactions: Transaction[]) => {
  const { deleteMultipleTransactions, transactions: allTransactions } = useTransactions();
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const numSelected = selectedTransactionIds.length;
  const isAllSelectedOnPage = pageTransactions.length > 0 && numSelected === pageTransactions.length;

  const handleSelectOne = (id: string) => {
    setSelectedTransactionIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelectedOnPage) {
      setSelectedTransactionIds([]);
    } else {
      setSelectedTransactionIds(pageTransactions.map(t => t.id));
    }
  };

  const clearSelection = () => {
    setSelectedTransactionIds([]);
  };

  const handleBulkDelete = () => {
    if (numSelected === 0 || !allTransactions) return;

    const transactionsToDelete = selectedTransactionIds.flatMap(id => {
      const transaction = allTransactions.find(t => t.id === id);
      if (!transaction) return [];
      
      const items = [transaction.id];
      if (transaction.transfer_id) {
        const pairedTransaction = allTransactions.find(
          p => p.id !== transaction.id && p.transfer_id === transaction.transfer_id
        );
        if (pairedTransaction) {
          items.push(pairedTransaction.id);
        }
      }
      return items;
    });

    const uniqueIdsToDelete = [...new Set(transactionsToDelete)];
    deleteMultipleTransactions(uniqueIdsToDelete);
    clearSelection();
    setIsBulkDeleteConfirmOpen(false);
  };

  return {
    selectedTransactionIds,
    isBulkDeleteConfirmOpen,
    setIsBulkDeleteConfirmOpen,
    handleSelectOne,
    handleSelectAll,
    isAllSelectedOnPage,
    handleBulkDelete,
    numSelected,
    clearSelection,
  };
};