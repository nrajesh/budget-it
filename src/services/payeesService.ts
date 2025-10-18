import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Payee } from '@/contexts/TransactionsContext'; // Corrected import

export const getPayees = async (isAccount: boolean): Promise<Payee[]> => {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, is_account, account_id, accounts(currency, starting_balance, remarks)')
    .eq('is_account', isAccount);

  if (error) {
    showError('Failed to fetch payees.');
    console.error('Error fetching payees:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    is_account: item.is_account,
    account_id: item.account_id,
    currency: item.accounts?.currency,
    starting_balance: item.accounts?.starting_balance,
    remarks: item.accounts?.remarks,
  })) as Payee[];
};

export const addPayee = async (payee: Partial<Payee>): Promise<Payee | null> => {
  // Placeholder for add logic
  console.log('Adding payee:', payee);
  return null;
};

export const updatePayee = async (id: string, payee: Partial<Payee>): Promise<Payee | null> => {
  // Placeholder for update logic
  console.log('Updating payee:', id, payee);
  return null;
};

export const deletePayee = async (id: string): Promise<void> => {
  // Placeholder for delete logic
  console.log('Deleting payee:', id);
};