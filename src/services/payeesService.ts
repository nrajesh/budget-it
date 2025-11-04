import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Payee } from '@/components/AddEditPayeeDialog';

interface PayeesServiceProps {
  // No longer need setVendors, setAccounts as react-query will manage state
  convertAmount: (amount: number) => number;
}

export const createPayeesService = ({ convertAmount }: PayeesServiceProps) => {

  // These functions are now primarily for react-query's queryFn, not direct state manipulation
  const fetchVendors = async () => {
    const { data, error } = await supabase
      .rpc('get_vendors_with_transaction_counts');

    if (error) {
      throw error; // Throw error for react-query to catch
    }
    // Map the data to include the totalTransactions field
    const vendorsWithCounts: Payee[] = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      is_account: item.is_account,
      created_at: item.created_at,
      account_id: item.account_id,
      currency: item.currency,
      starting_balance: item.starting_balance,
      remarks: item.remarks,
      running_balance: item.running_balance,
      totalTransactions: item.total_transactions || 0,
    }));
    return vendorsWithCounts;
  };

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .rpc('get_accounts_with_transaction_counts');

    if (error) {
      throw error; // Throw error for react-query to catch
    }
    // Map the data to include the totalTransactions field
    const accountsWithCounts: Payee[] = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      is_account: item.is_account,
      created_at: item.created_at,
      account_id: item.account_id,
      currency: item.currency,
      starting_balance: item.starting_balance,
      remarks: item.remarks,
      running_balance: item.running_balance,
      totalTransactions: item.total_transactions || 0,
    }));
    return accountsWithCounts;
  };

  return {
    fetchVendors,
    fetchAccounts,
  };
};