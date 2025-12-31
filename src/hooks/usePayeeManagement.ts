import { useState } from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { Payee } from '@/types/payee';
import { useEntityManagement } from './useEntityManagement';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';

export function usePayeeManagement(isAccountMode: boolean = false) {
  const { vendors, accounts, isLoadingVendors, isLoadingAccounts, refetchVendors, refetchAccounts } = useTransactions();
  const queryClient = useQueryClient();

  const data = isAccountMode ? accounts : vendors;
  const isLoading = isAccountMode ? isLoadingAccounts : isLoadingVendors;

  const managementProps = useEntityManagement<Payee>({
    data: data as Payee[],
    entityName: isAccountMode ? 'Account' : 'Vendor',
    entityNamePlural: isAccountMode ? 'Accounts' : 'Vendors',
    queryKey: [isAccountMode ? 'accounts' : 'vendors'],
    deleteRpcFn: 'delete_payees_batch',
  });

  const handlePayeeNameClick = (name: string) => {
    console.log(`Clicked payee: ${name}`);
  };

  const handleImport = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (isAccountMode) {
            const accountsToUpsert = results.data.map((row: any) => ({
              name: row.name || row.Account || row.AccountName,
              currency: row.currency || row.Currency || 'USD',
              starting_balance: parseFloat(row.starting_balance || row.Balance || '0'),
              remarks: row.remarks || row.Remarks || ''
            })).filter((a: any) => a.name);

            const { error } = await supabase.rpc('batch_upsert_accounts', { 
              p_accounts: accountsToUpsert 
            });
            if (error) throw error;
            toast.success('Accounts imported successfully');
            refetchAccounts();
          } else {
            const names = results.data.map((row: any) => row.name || row.Vendor || row.Payee).filter(Boolean);
            const { error } = await supabase.rpc('batch_upsert_vendors', { p_names: names });
            if (error) throw error;
            toast.success('Vendors imported successfully');
            refetchVendors();
          }
        } catch (error: any) {
          console.error('Import error:', error);
          toast.error(`Error importing ${isAccountMode ? 'accounts' : 'vendors'}: ${error.message}`);
        }
      }
    });
  };

  return {
    ...managementProps,
    handlePayeeNameClick,
    handleImport,
    isLoading,
    refetch: isAccountMode ? refetchAccounts : refetchVendors,
  };
}