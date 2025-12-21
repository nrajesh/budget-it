import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  total_transactions: number | null;
}

export const useCategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]); // For batch operations

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('User not authenticated.');
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc('get_categories_with_transaction_counts', { user_id_param: user.id });

    if (error) {
      toast.error(`Error fetching categories: ${error.message}`);
      console.error('Error fetching categories:', error);
      setCategories([]);
    } else {
      setCategories(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const invalidateCategories = () => {
    fetchCategories();
  };

  const handleCategoryNameClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const addCategory = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('User not authenticated.');
      return;
    }

    const { error } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name });

    if (error) {
      toast.error(`Error adding category: ${error.message}`);
      console.error('Error adding category:', error);
    } else {
      toast.success(`Category "${name}" added successfully!`);
      invalidateCategories();
    }
  };

  const deleteCategories = async (ids: string[]) => {
    if (ids.length === 0) return;
    const { error } = await supabase.rpc('delete_categories_batch', { p_vendor_ids: ids }); // p_vendor_ids is a misnomer here, it expects category IDs
    if (error) {
      toast.error(`Error deleting categories: ${error.message}`);
      console.error('Error deleting categories:', error);
    } else {
      toast.success(`${ids.length} categories deleted successfully!`);
      invalidateCategories();
    }
  };

  const updateCategory = async (id: string, newName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('User not authenticated.');
      return;
    }

    const { error } = await supabase
      .from('categories')
      .update({ name: newName })
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user can only update their own categories

    if (error) {
      toast.error(`Error updating category: ${error.message}`);
      console.error('Error updating category:', error);
    } else {
      toast.success(`Category "${newName}" updated successfully!`);
      invalidateCategories();
    }
  };

  return {
    categories,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    isDialogOpen,
    setIsDialogOpen,
    handleCategoryNameClick,
    addCategory,
    deleteCategories,
    updateCategory,
    invalidateCategories,
    selectedCategoryIds,
    setSelectedCategoryIds,
  };
};