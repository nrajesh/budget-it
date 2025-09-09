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
      .from("vendors")
      .select("*")
      .eq('is_account', false)
      .order('name', { ascending: true });

    if (error) {
      showError(`Failed to fetch vendors: ${error.message}`);
      setVendors([]);
    } else {
      setVendors(data as Payee[]);
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