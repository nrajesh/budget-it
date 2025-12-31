import { useTransactions } from '@/contexts/TransactionsContext';
import { useEntityManagement } from './useEntityManagement';
import { Payee } from '@/types/payee';

export function usePayeeManagement(isAccount: boolean) {
  const { accounts, vendors, isLoadingAccounts, isLoadingVendors } = useTransactions();
  const data = isAccount ? accounts : vendors;
  const isLoading = isAccount ? isLoadingAccounts : isLoadingVendors;
  const entityName = isAccount ? 'Account' : 'Vendor';
  const entityNamePlural = isAccount ? 'Accounts' : 'Vendors';

  const managementProps = useEntityManagement<Payee>({
    data,
    entityName,
    entityNamePlural,
    queryKey: [isAccount ? 'accounts' : 'vendors'],
    deleteRpcFn: 'delete_payees_batch',
    batchUpsertRpcFn: isAccount ? 'batch_upsert_accounts' : 'batch_upsert_vendors',
  });

  const handleImport = async (file: File) => {
    if (!file) return;
    managementProps.batchUpsertMutation.reset();
    // Simplified import logic
    const dataToUpsert = ['Sample 1', 'Sample 2']; 
    managementProps.batchUpsertMutation.mutate(dataToUpsert);
  };

  return {
    ...managementProps,
    isLoading,
    handleImport,
  };
}