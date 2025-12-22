import { useTransactions } from '@/contexts/TransactionsContext';
import { useUser } from '@/hooks/useUser';
import { useQueryClient } from '@tanstack/react-query';

export const useScheduledTransactionManagement = () => {
  const { user } = useUser();
  const {
    scheduledTransactions,
    isLoadingScheduledTransactions,
    refetchScheduledTransactions,
    invalidateAllData
  } = useTransactions();

  // ... rest of the hook implementation
};