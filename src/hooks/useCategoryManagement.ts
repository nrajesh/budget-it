import { useTransactions } from '@/contexts/TransactionsContext';
import { useEntityManagement } from './useEntityManagement';
import { Category } from '@/types/category';
import { useUser } from '@/contexts/UserContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCategoryManagement() {
  const { user } = useUser();
  const { categories, isLoadingCategories, refetchCategories } = useTransactions();
  const queryClient = useQueryClient();

  const managementProps = useEntityManagement<Category>({
    data: categories,
    entityName: 'Category',
    entityNamePlural: 'Categories',
    queryKey: ['categories', user?.id],
    deleteRpcFn: 'delete_categories_batch',
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('categories').insert([{ name, user_id: user?.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
      refetchCategories();
    }
  });

  return {
    ...managementProps,
    addCategoryMutation,
    deleteCategoriesMutation: managementProps.deleteMutation,
    isLoadingMutation: addCategoryMutation.isPending || managementProps.deleteMutation.isPending,
  };
}