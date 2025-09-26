import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Payee } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

interface UsePayeeManagementProps {
  entityType: 'account' | 'vendor';
}

export const usePayeeManagement = ({ entityType }: UsePayeeManagementProps) => {
  const queryClient = useQueryClient();
  const queryKey = entityType === 'account' ? 'accounts' : 'vendors';
  const rpcFunction = entityType === 'account' ? 'get_accounts_with_transaction_counts' : 'get_vendors_with_transaction_counts';

  const { data: payees = [], isLoading } = useQuery<Payee[]>({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(rpcFunction);
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { mutate: deletePayees, isPending: isDeleting } = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.rpc('delete_payees_batch', { p_vendor_ids: ids });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess(`${entityType}(s) deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error) => {
      showError(`Failed to delete ${entityType}(s): ${error.message}`);
    },
  });

  const { mutate: updatePayee, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.rpc('update_vendor_name', { p_vendor_id: id, p_new_name: name });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess(`${entityType} updated successfully.`);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error) => {
      showError(`Failed to update ${entityType}: ${error.message}`);
    },
  });

  const handleEdit = (id: string, currentName: string) => {
    const newName = prompt(`Enter new name for ${currentName}:`, currentName);
    if (newName && newName !== currentName) {
      updatePayee({ id, name: newName });
    }
  };

  return {
    payees,
    isLoading,
    handleEdit,
    deletePayees,
    isDeleting,
    isUpdating,
  };
};