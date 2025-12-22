import { useTransactions } from '@/contexts/TransactionsContext';
import { useUser } from '@/hooks/useUser';
import { useEntityManagement } from './useEntityManagement';
import { Category } from '@/types/category';

export const useCategoryManagement = () => {
  const { user } = useUser();
  const {
    categories,
    isLoadingCategories,
    refetchCategories,
    invalidateAllData
  } = useTransactions();

  const management = useEntityManagement<Category>(categories);

  const handleCategoryNameClick = (name: string) => {
    console.log(`Category clicked: ${name}`);
    // Placeholder logic
  };

  return {
    ...management,
    categories,
    isLoadingCategories,
    refetchCategories,
    invalidateAllData,
    handleCategoryNameClick,
  };
};