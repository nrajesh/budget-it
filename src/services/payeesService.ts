import { SupabaseClient } from '@supabase/supabase-js';
import { showError } from '@/utils/toast';
import { Payee } from '@/types/finance';

export const createPayeesService = (supabase: SupabaseClient) => {
  const getAccounts = async (): Promise<Payee[]> => {
    const { data, error } = await supabase.rpc('get_accounts_with_transaction_counts');
    if (error) {
      showError(`Failed to fetch accounts: ${error.message}`);
      throw error;
    }
    return data || [];
  };

  const getVendors = async (): Promise<Payee[]> => {
    const { data, error } = await supabase.rpc('get_vendors_with_transaction_counts');
    if (error) {
      showError(`Failed to fetch vendors: ${error.message}`);
      throw error;
    }
    return data || [];
  };

  const addPayee = async (payee: Omit<Payee, 'id'>) => {
    if (payee.is_account) {
      const { error } = await supabase.rpc('batch_upsert_accounts', {
        p_accounts: [{
          name: payee.name,
          currency: payee.currency,
          starting_balance: payee.starting_balance,
          remarks: payee.remarks,
        }],
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.from('vendors').insert({ name: payee.name, is_account: false });
      if (error) throw error;
    }
  };

  const updatePayee = async (id: string, updates: Partial<Payee>) => {
    const { error } = await supabase.rpc('update_vendor_name', {
      p_vendor_id: id,
      p_new_name: updates.name,
    });
    if (error) throw error;
  };

  const deletePayee = async (id: string) => {
    const { error } = await supabase.rpc('delete_vendor_and_update_transactions', { p_vendor_id: id });
    if (error) throw error;
  };

  const deletePayeesBatch = async (ids: string[]) => {
    const { error } = await supabase.rpc('delete_payees_batch', { p_vendor_ids: ids });
    if (error) throw error;
  };

  const batchUpsertAccounts = async (accounts: any[]) => {
    const { error } = await supabase.rpc('batch_upsert_accounts', { p_accounts: accounts });
    if (error) throw error;
  };

  const batchUpsertVendors = async (names: string[]) => {
    const { error } = await supabase.rpc('batch_upsert_vendors', { p_names: names });
    if (error) throw error;
  };

  return {
    getAccounts,
    getVendors,
    addPayee,
    updatePayee,
    deletePayee,
    deletePayeesBatch,
    batchUpsertAccounts,
    batchUpsertVendors,
  };
};