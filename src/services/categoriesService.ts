import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Category } from '@/pages/Categories';
import { ensureCategoryExists } from '@/integrations/supabase/utils';
import { Transaction } from '@/data/finance-data';

interface CategoriesServiceProps {
  // No longer need setCategories as react-query will manage state
  userId: string | undefined;
  // getTransactions is no longer needed here as categories are fetched independently
}

export const createCategoriesService = ({ userId }: CategoriesServiceProps) => {

  // This function is now primarily for react-query's queryFn, not direct state manipulation
  const fetchCategories = async () => {
    if (!userId) {
      return []; // Return empty array if no user
    }
    try {
      // Ensure default categories for the new user
      await supabase.rpc('ensure_default_categories_for_user', { p_user_id: userId });

      // Fetch categories with transaction counts
      const { data, error } = await supabase
        .rpc('get_categories_with_transaction_counts', { user_id_param: userId });

      if (error) {
        throw error; // Throw error for react-query to catch
      }

      // Map the data to include the totalTransactions field
      const categoriesWithCounts: Category[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        user_id: item.user_id,
        created_at: item.created_at,
        totalTransactions: item.total_transactions || 0,
      }));

      return categoriesWithCounts;
    } catch (error: any) {
      console.error(`Failed to fetch categories: ${error.message}`);
      throw error; // Re-throw for react-query
    }
  };

  const batchUpsertCategories = async (categoryNames: string[]) => {
    if (!userId) {
      showError("User not logged in. Cannot import categories.");
      throw new Error("User not logged in.");
    }
    if (categoryNames.length === 0) return;

    try {
      const categoriesToInsert = categoryNames.map(name => ({
        name: name.trim(),
        user_id: userId,
      }));

      const { error } = await supabase.from('categories').upsert(categoriesToInsert, { onConflict: 'name', ignoreDuplicates: true });

      if (error) throw error;
      showSuccess(`${categoriesToInsert.length} categories imported/updated successfully!`);
      // No direct fetchCategories() call here, react-query will handle invalidation
    } catch (error: any) {
      showError(`Failed to batch upsert categories: ${error.message}`);
      throw error;
    }
  };

  return {
    fetchCategories,
    batchUpsertCategories,
  };
};