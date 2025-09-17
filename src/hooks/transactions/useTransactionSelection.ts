import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { showSuccess } from '@/utils/toast';

export const useTransactionSelection = (currentTransactions: any[], allTransactions: any[]) => {
  const { deleteMultipleTransactions } = useTransactions();
  const [selectedTransactionIds, setSelectedTransactionIds] = React.useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTransactionIds(currentTransactions.map(t => t.id));
    } else {
      setSelectedTransactionIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedTransactionIds(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    await deleteMultipleTransactions(selectedTransactionIds);
    setSelectedTransactionIds([]);
  };

  const isAllSelected = selectedTransactionIds.length > 0 && selectedTransactionIds.length === currentTransactions.length;
  const isAnySelected = selectedTransactionIds.length > 0;

  return {
    selectedTransactionIds,
    handleSelectAll,
    handleSelectRow,
    handleDeleteSelected,
    isAllSelected,
    isAnySelected,
  };
};