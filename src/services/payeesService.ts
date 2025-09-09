import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Payee } from '@/components/AddEditPayeeDialog';

interface PayeesServiceProps {
  setVendors: React.Dispatch<React.SetStateAction<Payee[]>>;
  setAccounts: React.Dispatch<React.SetStateAction<Payee[]>>;
  convertAmount: (amount: number) => number;
}

export const createPayeesService = ({ setVendors, setAccounts, convertAmount }: PayeesServiceProps) => {

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .rpc('get_vendors_with_transaction_counts');

    if (error) {
      showError(`Failed to fetch vendors: ${error.message}`);
      setVendors([]);
    } else {
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
      setVendors(vendorsWithCounts);
    }
  };

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .rpc('get_accounts_with_transaction_counts');

    if (error) {
      showError(`Failed to fetch accounts: ${error.message}`);
      setAccounts([]);
    } else {
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
      setAccounts(accountsWithCounts);
    }
  };

  return {
    fetchVendors,
    fetchAccounts,
  };
};