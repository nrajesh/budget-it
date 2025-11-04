import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ScheduledTransaction } from '@/types/finance';
import { useToast } from '@/components/ui/use-toast';

const fetchScheduledTransactions = async (userId: string) => {
  const { data, error } = await supabase
    .from('scheduled_transactions')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
};

const saveScheduledTransaction = async (transaction: Partial<ScheduledTransaction>) => {
  if (transaction.id) {
    const { id, ...updates } = transaction;
    const { error } = await supabase.from('scheduled_transactions').update(updates).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('scheduled_transactions').insert(transaction);
    if (error) throw error;
  }
};

const deleteScheduledTransaction = async (id: string) => {
  const { error } = await supabase.from('scheduled_transactions').delete().eq('id', id);
  if (error) throw error;
};

export const useScheduledTransactionManagement = () => {
  const { user } = useUser();
  const { accounts, vendors, categories, isLoadingAccounts, isLoadingVendors, isLoadingCategories, refetchTransactions: refetchMainTransactions } = useTransactions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scheduledTransactions = [], isLoading: isLoadingScheduled } = useQuery({
    queryKey: ['scheduled_transactions', user?.id],
    queryFn: () => fetchScheduledTransactions(user!.id),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: saveScheduledTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled_transactions', user?.id] });
      toast({ title: 'Success', description: 'Scheduled transaction saved.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ScheduledTransaction | undefined>(undefined);

  const handleAddNew = () => {
    setEditingTransaction(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (transaction: ScheduledTransaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScheduledTransaction(id);
      queryClient.invalidateQueries({ queryKey: ['scheduled_transactions', user?.id] });
      toast({ title: 'Success', description: 'Scheduled transaction deleted.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSave = (data: any) => {
    mutation.mutate({ ...data, user_id: user?.id, id: editingTransaction?.id });
  };

  return {
    scheduledTransactions,
    isLoading: isLoadingScheduled || isLoadingAccounts || isLoadingVendors || isLoadingCategories,
    isFormOpen,
    setIsFormOpen,
    editingTransaction,
    handleAddNew,
    handleEdit,
    handleDelete,
    handleSave,
    accounts,
    vendors,
    categories,
  };
};