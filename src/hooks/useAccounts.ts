import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Account } from '@/types/database';
import toast from 'react-hot-toast';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Using RPC to call the stored procedure for accounts data
      const { data, error } = await supabase.rpc('get_accounts_with_transaction_counts');

      if (error) {
        throw new Error(error.message);
      }

      setAccounts(data || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Failed to load accounts.");
      toast.error("Failed to load accounts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, isLoading, error, refetch: fetchAccounts };
};