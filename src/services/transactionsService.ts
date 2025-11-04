import { SupabaseClient } from '@supabase/supabase-js';

export const createTransactionsService = (supabase: SupabaseClient) => {
  const getTransactions = async () => {
    const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const addTransaction = async (transaction: any) => {
    const { error } = await supabase.from('transactions').insert(transaction);
    if (error) throw error;
  };

  const updateTransaction = async (id: string, updates: any) => {
    const { error } = await supabase.from('transactions').update(updates).eq('id', id);
    if (error) throw error;
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  };

  const deleteMultipleTransactions = async (ids: string[]) => {
    const { error } = await supabase.from('transactions').delete().in('id', ids);
    if (error) throw error;
  };
  
  const clearAllData = async () => {
    const { error } = await supabase.rpc('clear_all_app_data');
    if (error) throw error;
  };

  const generateDiverseDemoData = async () => {
    // This would call a Supabase Edge Function or RPC to generate data.
    // For now, we'll just log it.
    console.log("Generating demo data...");
  };

  return {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    clearAllData,
    generateDiverseDemoData,
  };
};