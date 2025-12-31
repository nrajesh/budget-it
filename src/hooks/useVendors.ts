import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Account as Vendor } from '@/types/database'; // Vendors share the same structure as Accounts for display
import toast from 'react-hot-toast';

export const useVendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Using RPC to call the stored procedure for vendors data
      const { data, error } = await supabase.rpc('get_vendors_with_transaction_counts');

      if (error) {
        throw new Error(error.message);
      }

      // Filter out items where is_account is true, as this hook is for vendors/payees
      setVendors(data ? data.filter(v => !v.is_account) : []);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError("Failed to load vendors.");
      toast.error("Failed to load vendors.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, isLoading, error, refetch: fetchVendors };
};