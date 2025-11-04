import { SupabaseClient } from '@supabase/supabase-js';
import { Category } from '@/types/finance';

export const createCategoriesService = (supabase: SupabaseClient, userId: string | undefined) => {
  const getCategories = async (): Promise<Category[]> => {
    if (!userId) return [];
    const { data, error } = await supabase.rpc('get_categories_with_transaction_counts', { user_id_param: userId });
    if (error) throw error;
    return data || [];
  };

  const addCategory = async (category: { name: string }) => {
    if (!userId) throw new Error("User not authenticated");
    const { error } = await supabase.from('categories').insert({ ...category, user_id: userId });
    if (error) throw error;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { error } = await supabase.from('categories').update(updates).eq('id', id);
    if (error) throw error;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  };
  
  const deleteCategoriesBatch = async (ids: string[]) => {
    const { error } = await supabase.rpc('delete_categories_batch', { p_vendor_ids: ids });
    if (error) throw error;
  };

  const batchUpsertCategories = async (categoryNames: string[]) => {
    if (!userId) throw new Error("User not authenticated");
    const categoriesToInsert = categoryNames.map(name => ({ name, user_id: userId }));
    const { error } = await supabase.from('categories').upsert(categoriesToInsert, { onConflict: 'user_id, name' });
    if (error) throw error;
  };

  return {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    deleteCategoriesBatch,
    batchUpsertCategories,
  };
};