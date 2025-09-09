import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Category } from '@/pages/Categories'; // Import the Category type
import { ensureCategoryExists } from '@/integrations/supabase/utils'; // Import ensureCategoryExists
import { Transaction } from '@/data/finance-data'; // Import Transaction type
import { useCurrency } from '@/contexts/CurrencyContext'; // Import useCurrency

interface CategoriesServiceProps {
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  userId: string | undefined;
  getTransactions: () => Transaction[]; // Changed to a getter function
}

export const createCategoriesService = ({ setCategories, userId, getTransactions }: CategoriesServiceProps) => {
  const { convertAmount } = useCurrency(); // Use useCurrency hook here

  const syncCategoriesFromTransactions = async () => {
    if (!userId) {
      return;
    }
    const currentTransactions = getTransactions(); // Get latest transactions here

    if (currentTransactions.length === 0) {
      return;
    }

    try {
      const uniqueTransactionCategories = new Set<string>();
      currentTransactions.forEach(t => { // Use currentTransactions
        if (t.category && t.category !== 'Transfer') { // Exclude 'Transfer' as it's a special category
          uniqueTransactionCategories.add(t.category);
        }
      });

      // Ensure each category from transactions exists in the categories table
      await Promise.all(Array.from(uniqueTransactionCategories).map(categoryName =>
        ensureCategoryExists(categoryName, userId)
      ));
    } catch (error: any) {
      console.error("Error syncing categories from transactions:", error.message);
      showError("Failed to synchronize categories from transactions.");
    }
  };

  const fetchCategories = async () => {
    if (!userId) {
      setCategories([]);
      return;
    }
    try {
      // Ensure 'Others' category exists for the current user
      await ensureCategoryExists('Others', userId);

      // First, ensure all categories from transactions are in the categories table
      await syncCategoriesFromTransactions(); // Call sync before fetching

      const { data, error } = await supabase
        .from("category_transaction_summary") // Fetch from the new view
        .select("id, name, user_id, created_at, total_transaction_amount")
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      // Map total_transaction_amount to totalTransactions and convert
      const categoriesWithTransactions = data.map(cat => ({
        ...cat,
        totalTransactions: convertAmount(cat.total_transaction_amount || 0),
      }));
      setCategories(categoriesWithTransactions as Category[]);
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

      const { error } = await supabase.from('categories').upsert(categoriesToInsert, { onConflict: 'user_id,name', ignoreDuplicates: true });

      if (error) throw error;
      showSuccess(`${categoriesToInsert.length} categories imported/updated successfully!`);
      fetchCategories(); // Re-fetch to update the list
    } catch (error: any) {
      showError(`Failed to batch upsert categories: ${error.message}`);
    }
  };

  return {
    fetchCategories,
    batchUpsertCategories,
  };
};