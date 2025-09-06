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
    const { data: vendorsData, error } = await supabase
      .from("vendors_with_balance")
      .select("*")
      .eq('is_account', false)
      .order('name', { ascending: true });

    if (error) {
      showError(`Failed to fetch vendors: ${error.message}`);
      setVendors([]);
    } else {
      const vendorsWithTransactions = await Promise.all(
        vendorsData.map(async (vendor) => {
          const { data: transactionsSumData, error: sumError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('vendor', vendor.name);

          if (sumError) {
            console.error(`Error fetching transaction sum for ${vendor.name}:`, sumError.message);
            return { ...vendor, totalTransactions: 0 };
          }

          const totalAmount = transactionsSumData.reduce((sum, t) => sum + t.amount, 0);
          return { ...vendor, totalTransactions: convertAmount(totalAmount) };
        })
      );
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