import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Payee } from '@/components/AddEditPayeeDialog';
import { useCurrency } from '@/contexts/CurrencyContext'; // Import useCurrency

interface PayeesServiceProps {
  setVendors: React.Dispatch<React.SetStateAction<Payee[]>>;
  setAccounts: React.Dispatch<React.SetStateAction<Payee[]>>;
  convertAmount: (amount: number) => number;
}

export const createPayeesService = ({ setVendors, setAccounts, convertAmount }: PayeesServiceProps) => {

  const fetchVendors = async () => {
    // Use the new vendor_transaction_summary view to get total_transaction_amount efficiently
    const { data: vendorsData, error } = await supabase
      .from("vendor_transaction_summary") // Changed to use the new view
      .select("*")
      .eq('is_account', false)
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
    const { data, error } = await supabase
      .from("vendors_with_balance")
      .select("*")
      .eq('is_account', true)
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