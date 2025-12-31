import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types/database';
import toast from 'react-hot-toast';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Note: This requires the user to be authenticated (auth.uid() is used in the RPC function)
      const { data, error } = await supabase.rpc('get_categories_with_transaction_counts', {
        user_id_param: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories.");
      toast.error("Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, error, refetch: fetchCategories };
};