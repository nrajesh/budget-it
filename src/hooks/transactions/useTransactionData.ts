import { useTransactions } from '@/contexts/TransactionsContext';
import { useUser } from '@/hooks/useUser';
import { useQueryClient } from '@tanstack/react-query';

export const useTransactionData = () => {
  const { user } = useUser();
  const {
    transactions,
    isLoadingTransactions,
    refetchTransactions,
    invalidateAllData
  } = useTransactions();

  // ... rest of the hook implementation
};