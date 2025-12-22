import { useTransactions } from '@/contexts/TransactionsContext';
import { useUser } from '@/hooks/useUser';
import { useQueryClient } from '@tanstack/react-query';

export const useCategoryManagement = () => {
  const { user } = useUser();
  const {
    categories,
    isLoadingCategories,
    refetchCategories,
    invalidateAllData
  } = useTransactions();

  // ... rest of the hook implementation
};