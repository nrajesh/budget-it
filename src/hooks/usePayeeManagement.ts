import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Payee } from '@/types/payee';
import { useUser } from '@/hooks/useUser';

export const usePayeeManagement = (isAccountContext: boolean) => {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false); // Added proper state initialization
  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();

  const fetchPayees = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = isAccountContext
        ? await supabase.rpc('get_accounts_with_transaction_counts')
        : await supabase.rpc('get_vendors_with_transaction_counts');

      if (error) throw error;

      setPayees(data || []);
    } catch (error) {
      console.error('Error fetching payees:', error);
      showError('Failed to fetch payees');
    } finally {
      setIsLoading(false);
    }
  }, [user, isAccountContext]);

  useEffect(() => {
    fetchPayees();
  }, [fetchPayees]);

  const addPayee = async (name: string) => {
    if (!user) return;

    try {
      if (isAccountContext) {
        const { error } = await supabase.rpc('batch_upsert_accounts', {
          p_accounts: [{ name, currency: 'USD', starting_balance: 0, remarks: '' }]
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('batch_upsert_vendors', {
          p_names: [name]
        });

        if (error) throw error;
      }

      showSuccess(`${isAccountContext ? 'Account' : 'Vendor'} added successfully`);
      await fetchPayees();
    } catch (error) {
      console.error('Error adding payee:', error);
      showError(`Failed to add ${isAccountContext ? 'account' : 'vendor'}`);
    }
  };

  const updatePayee = async (updatedPayee: Payee) => {
    if (!user) return;

    try {
      if (isAccountContext) {
        const { error } = await supabase.rpc('batch_upsert_accounts', {
          p_accounts: [{
            name: updatedPayee.name,
            currency: updatedPayee.currency || 'USD',
            starting_balance: updatedPayee.starting_balance || 0,
            remarks: updatedPayee.remarks || ''
          }]
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('update_vendor_name', {
          p_vendor_id: updatedPayee.id,
          p_new_name: updatedPayee.name
        });

        if (error) throw error;
      }

      showSuccess(`${isAccountContext ? 'Account' : 'Vendor'} updated successfully`);
      await fetchPayees();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating payee:', error);
      showError(`Failed to update ${isAccountContext ? 'account' : 'vendor'}`);
    }
  };

  const deletePayees = async (payeeIds: string[]) => {
    if (!user) return;

    try {
      const { error } = isAccountContext
        ? await supabase.rpc('delete_payees_batch', { p_vendor_ids: payeeIds })
        : await supabase.rpc('delete_payees_batch', { p_vendor_ids: payeeIds });

      if (error) throw error;

      showSuccess(`${payeeIds.length} ${isAccountContext ? 'accounts' : 'vendors'} deleted successfully`);
      await fetchPayees();
    } catch (error) {
      console.error('Error deleting payees:', error);
      showError(`Failed to delete ${isAccountContext ? 'accounts' : 'vendors'}`);
    }
  };

  const handlePayeeNameClick = (payee: Payee) => {
    setSelectedPayee(payee);
    setIsDialogOpen(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true); // Properly set the importing state
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const names = lines.map(line => line.trim()).filter(line => line);

      if (isAccountContext) {
        const accounts = names.map(name => ({
          name,
          currency: 'USD',
          starting_balance: 0,
          remarks: ''
        }));

        const { error } = await supabase.rpc('batch_upsert_accounts', {
          p_accounts: accounts
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('batch_upsert_vendors', {
          p_names: names
        });

        if (error) throw error;
      }

      showSuccess(`Successfully imported ${names.length} ${isAccountContext ? 'accounts' : 'vendors'}`);
      await fetchPayees();
    } catch (error) {
      console.error('Error importing payees:', error);
      showError(`Failed to import ${isAccountContext ? 'accounts' : 'vendors'}`);
    } finally {
      setIsImporting(false); // Reset the importing state
    }
  };

  return {
    payees,
    isLoading,
    isImporting,
    selectedPayee,
    isDialogOpen,
    setIsDialogOpen,
    addPayee,
    updatePayee,
    deletePayees,
    handlePayeeNameClick,
    handleFileChange
  };
};