import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Payee {
  id: string;
  name: string;
  is_account: boolean;
  created_at: string;
  account_id: string | null;
  currency: string | null;
  starting_balance: number | null;
  remarks: string | null;
  running_balance: number | null;
  total_transactions: number | null;
}

interface AccountUpsertType {
  name: string;
  currency: string;
  starting_balance: number;
  remarks: string;
}

export const usePayeeManagement = (isAccountContext: boolean) => {
  const [isImporting, setIsImporting] = useState(false);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayees, setSelectedPayees] = useState<string[]>([]); // For batch operations

  const fetchPayees = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = isAccountContext
      ? await supabase.rpc('get_accounts_with_transaction_counts')
      : await supabase.rpc('get_vendors_with_transaction_counts');

    if (error) {
      toast.error(`Error fetching ${isAccountContext ? 'accounts' : 'vendors'}: ${error.message}`);
      console.error(`Error fetching ${isAccountContext ? 'accounts' : 'vendors'}:`, error);
      setPayees([]);
    } else {
      setPayees(data || []);
    }
    setIsLoading(false);
  }, [isAccountContext]);

  useEffect(() => {
    fetchPayees();
  }, [fetchPayees]);

  const invalidatePayees = () => {
    fetchPayees();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(1); // Skip header
      const newAccounts: AccountUpsertType[] = [];

      for (const line of lines) {
        const parts = line.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^,\"]*))/g)?.map(p => p?.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
        
        if (!parts || parts.length < 8) {
          continue;
        }

        const name = parts[1]; // "Account" column
        const startingBalanceStr = parts[2]; // "Today" column
        const remarks = parts[7]; // "Notes" column

        const cleanedBalance = startingBalanceStr.replace(/\./g, '').replace(',', '.');
        const starting_balance = parseFloat(cleanedBalance);

        let currency = 'EUR';
        if (remarks.includes('USD') || name.includes('USD')) currency = 'USD';
        else if (remarks.includes('GBP') || name.includes('GBP')) currency = 'GBP';
        else if (remarks.includes('INR') || name.includes('INR')) currency = 'INR';
        else if (remarks.includes('CHF') || name.includes('CHF')) currency = 'CHF';

        if (name && !isNaN(starting_balance)) {
          newAccounts.push({ name, currency, starting_balance, remarks });
        }
      }

      if (newAccounts.length > 0) {
        const { error } = await supabase.rpc('batch_upsert_accounts', { p_accounts: newAccounts });
        if (error) {
          toast.error(`Error importing accounts: ${error.message}`);
          console.error('Error importing accounts:', error);
        } else {
          toast.success(`${newAccounts.length} accounts imported successfully!`);
          invalidatePayees();
        }
      } else {
        toast.info('No valid accounts found in the CSV to import.');
      }
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const handlePayeeNameClick = (payee: Payee) => {
    setSelectedPayee(payee);
    setIsDialogOpen(true);
  };

  const addPayee = async (name: string, currency?: string, starting_balance?: number, remarks?: string) => {
    if (isAccountContext) {
      const { error } = await supabase.rpc('batch_upsert_accounts', {
        p_accounts: [{ name, currency: currency || 'USD', starting_balance: starting_balance || 0, remarks: remarks || '' }],
      });
      if (error) {
        toast.error(`Error adding account: ${error.message}`);
        console.error('Error adding account:', error);
      } else {
        toast.success(`Account "${name}" added successfully!`);
        invalidatePayees();
      }
    } else {
      const { error } = await supabase.rpc('batch_upsert_vendors', { p_names: [name] });
      if (error) {
        toast.error(`Error adding vendor: ${error.message}`);
        console.error('Error adding vendor:', error);
      } else {
        toast.success(`Vendor "${name}" added successfully!`);
        invalidatePayees();
      }
    }
  };

  const deletePayees = async (ids: string[]) => {
    if (ids.length === 0) return;
    const { error } = await supabase.rpc('delete_payees_batch', { p_vendor_ids: ids });
    if (error) {
      toast.error(`Error deleting ${isAccountContext ? 'accounts' : 'vendors'}: ${error.message}`);
      console.error(`Error deleting ${isAccountContext ? 'accounts' : 'vendors'}:`, error);
    } else {
      toast.success(`${ids.length} ${isAccountContext ? 'accounts' : 'vendors'} deleted successfully!`);
      invalidatePayees();
    }
  };

  const updatePayee = async (id: string, newName: string, currency?: string, starting_balance?: number, remarks?: string) => {
    if (isAccountContext) {
      const { data: existingPayee, error: fetchError } = await supabase
        .from('vendors')
        .select('account_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingPayee?.account_id) {
        toast.error(`Error finding account for update: ${fetchError?.message || 'Account ID not found'}`);
        console.error('Error finding account for update:', fetchError);
        return;
      }

      const { error: updateVendorError } = await supabase.rpc('update_vendor_name', { p_vendor_id: id, p_new_name: newName });
      if (updateVendorError) {
        toast.error(`Error updating account name: ${updateVendorError.message}`);
        console.error('Error updating account name:', updateVendorError);
        return;
      }

      const { error: updateAccountError } = await supabase
        .from('accounts')
        .update({
          currency: currency || 'USD',
          starting_balance: starting_balance || 0,
          remarks: remarks || '',
        })
        .eq('id', existingPayee.account_id);

      if (updateAccountError) {
        toast.error(`Error updating account details: ${updateAccountError.message}`);
        console.error('Error updating account details:', updateAccountError);
        return;
      }

      toast.success(`Account "${newName}" updated successfully!`);
    } else {
      const { error } = await supabase.rpc('update_vendor_name', { p_vendor_id: id, p_new_name: newName });
      if (error) {
        toast.error(`Error updating vendor: ${error.message}`);
        console.error('Error updating vendor:', error);
        return;
      }
      toast.success(`Vendor "${newName}" updated successfully!`);
    }
    invalidatePayees();
  };

  return {
    isImporting,
    handleFileChange,
    payees,
    isLoading,
    selectedPayee,
    setSelectedPayee,
    isDialogOpen,
    setIsDialogOpen,
    handlePayeeNameClick,
    addPayee,
    deletePayees,
    updatePayee,
    invalidatePayees,
    selectedPayees,
    setSelectedPayees,
  };
};