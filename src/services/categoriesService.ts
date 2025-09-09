import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Category } from '@/pages/Categories'; // Import the Category type

interface CategoriesServiceProps {
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  userId: string | undefined;
}

export const createCategoriesService = ({ setCategories, userId }: CategoriesServiceProps) => {

  const fetchCategories = async () => {
    if (!userId) {
      setCategories([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, user_id, created_at")
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      setCategories(data as Category[]);
    } catch (error: any) {
      showError(`Failed to fetch categories: ${error.message}`);
      setCategories([]);
    }
  };

  const batchUpsertCategories = async (categoryNames: string[]) => {
    if (!userId) {
      showError("User not logged in. Cannot import categories.");
      return;
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
      fetchCategories();
    } catch (error: any) {
      showError(`Failed to batch upsert categories: ${error.message}`);
    }
  };

  return {
    fetchCategories,
    batchUpsertCategories,
  };
};