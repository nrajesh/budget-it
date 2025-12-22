import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Category } from '@/types/category';
import { useUser } from '@/hooks/useUser';

export const useCategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_categories_with_transaction_counts', {
        user_id_param: user.id
      });

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (name: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name, user_id: user.id }]);

      if (error) throw error;

      showSuccess('Category added successfully');
      await fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      showError('Failed to add category');
    }
  };

  const updateCategory = async (updatedCategory: Category) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: updatedCategory.name })
        .eq('id', updatedCategory.id);

      if (error) throw error;

      showSuccess('Category updated successfully');
      await fetchCategories();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating category:', error);
      showError('Failed to update category');
    }
  };

  const deleteCategories = async (categoryIds: string[]) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('delete_categories_batch', {
        p_vendor_ids: categoryIds
      });

      if (error) throw error;

      showSuccess(`${categoryIds.length} categories deleted successfully`);
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting categories:', error);
      showError('Failed to delete categories');
    }
  };

  const handleCategoryNameClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  return {
    categories,
    isLoading,
    selectedCategory,
    isDialogOpen,
    setIsDialogOpen,
    addCategory,
    updateCategory,
    deleteCategories,
    handleCategoryNameClick,
    refetchCategories: fetchCategories
  };
};