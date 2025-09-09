import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Payee } from '@/components/AddEditPayeeDialog';


interface PayeesServiceProps {
  setVendors: React.Dispatch<React.SetStateAction<Payee[]>>;
  setAccounts: React.Dispatch<React.SetStateAction<Payee[]>>;
  convertAmount: (amount: number) => number;
  userId: string | undefined; // Add userId
}

export const createPayeesService = ({ setVendors, setAccounts, convertAmount, userId }: PayeesServiceProps) => {

  const fetchVendors = async () => {
    if (!userId) {
      setVendors([]);
      return;
    }
    // Use the new vendor_transaction_summary view to get total_transaction_amount efficiently
    const { data: vendorsData, error } = await supabase
      .from("vendor_transaction_summary") // Changed to use the new view
      .select("*")
      .eq('is_account', false)
      .eq('user_id', userId) // Filter by user_id
      .order('name', { ascending: true });

    if (error) {
      showError(`Failed to fetch vendors: ${error.message}`);
      setVendors([]);
    } else {
      // Map total_transaction_amount to totalTransactions for consistency with Payee type
      const vendorsWithTransactions = vendorsData.map(vendor => ({
        ...vendor,
        totalTransactions: convertAmount(vendor.total_transaction_amount || 0),
      }));
      setVendors(vendorsWithTransactions as Payee[]);
    }
  };

  const fetchAccounts = async () => {
    if (!userId) {
      setAccounts([]);
      return;
    }
    const { data, error } = await supabase
      .from("vendors_with_balance")
      .select("*")
      .eq('is_account', true)
      .eq('user_id', userId) // Filter by user_id
      .order('name', { ascending: true });

    if (error) {
      showError(`Failed to fetch accounts: ${error.message}`);
      setAccounts([]);
    } else {
      setAccounts(data as Payee[]);
    }
  };

  return {
    fetchVendors,
    fetchAccounts,
  };
};