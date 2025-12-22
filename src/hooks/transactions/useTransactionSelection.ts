import { useTransactions } from '@/contexts/TransactionsContext';
import { useState } from 'react';

export const useTransactionSelection = () => {
  const { deleteMultipleTransactions } = useTransactions();
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);

  const handleDeleteSelected = async () => {
    if (selectedTransactionIds.length > 0) {
      await deleteMultipleTransactions(selectedTransactionIds);
      setSelectedTransactionIds([]);
    }
  };

  // ... rest of the hook implementation
};