import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './UserContext';
import { showSuccess, showError } from '@/utils/toast';
import { generateDiverseDemoData as demoDataGenerator } from '@/services/demoDataService';

interface TransactionsContextType {
  transactions: any[];
  accounts: any[];
  vendors: any[];
  categories: any[];
  isLoading: boolean;
  isLoadingTransactions: boolean;
  isLoadingAccounts: boolean;
  isLoadingVendors: boolean;
  isLoadingCategories: boolean;
  error: Error | null;
  addTransaction: (transaction: any) => Promise<void>;
  updateTransaction: (transaction: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteMultipleTransactions: (ids: string[]) => Promise<void>;
  accountCurrencyMap: Record<string, string>;
  generateDiverseDemoData: () => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  demoDataProgress: { progress: number; message: string };
  refetchTransactions: () => void;
  refetchAccounts: () => void;
  refetchVendors: () => void;
  refetchCategories: () => void;
  refetchAllPayees: () => void;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user, isLoadingUser } = useUser();
  const [demoDataProgress, setDemoDataProgress] = useState({ progress: 0, message: '' });

  const enabled = !!user && !isLoadingUser;

  const { data: transactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions').select('*').eq('user_id', user!.id).order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: accounts = [], isLoading: isLoadingAccounts, error: accountsError } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_accounts_with_transaction_counts');
      if (error) throw error;
      return data;
    },
    enabled,
  });
  
  const { data: vendors = [], isLoading: isLoadingVendors, error: vendorsError } = useQuery({
    queryKey: ['vendors', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vendors_with_transaction_counts');
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: categories = [], isLoading: isLoadingCategories, error: categoriesError } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_categories_with_transaction_counts', { user_id_param: user!.id });
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const accountCurrencyMap = React.useMemo(() => {
    return accounts.reduce((acc, account) => {
      acc[account.name] = account.currency || 'USD';
      return acc;
    }, {} as Record<string, string>);
  }, [accounts]);

  const { mutateAsync: addTransaction } = useMutation({
    mutationFn: async (transaction: any) => { /* ... */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showSuccess('Transaction added successfully!');
    },
    onError: (err) => showError(err.message),
  });

  const { mutateAsync: updateTransaction } = useMutation({
    mutationFn: async (transaction: any) => { /* ... */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showSuccess('Transaction updated successfully!');
    },
    onError: (err) => showError(err.message),
  });

  const { mutateAsync: deleteTransaction } = useMutation({
    mutationFn: async (id: string) => { /* ... */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showSuccess('Transaction deleted successfully!');
    },
    onError: (err) => showError(err.message),
  });

  const { mutateAsync: deleteMultipleTransactions } = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('transactions').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showSuccess(`${'Transactions'} deleted successfully!`);
    },
    onError: (err) => showError(err.message),
  });

  const { mutateAsync: generateDiverseDemoData } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not found");
      await demoDataGenerator(user.id, (progress, message) => setDemoDataProgress({ progress, message }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(); // Invalidate all queries
      showSuccess('Demo data generated successfully!');
    },
    onError: (err: any) => showError(err.message),
    onSettled: () => setDemoDataProgress({ progress: 0, message: '' }),
  });

  const { mutateAsync: clearAllTransactions } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('clear_all_app_data');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(); // Invalidate all queries
      showSuccess('All application data cleared!');
    },
    onError: (err: any) => showError(err.message),
  });

  const refetchTransactions = () => queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
  const refetchAccounts = () => queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
  const refetchVendors = () => queryClient.invalidateQueries({ queryKey: ['vendors', user?.id] });
  const refetchCategories = () => queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
  const refetchAllPayees = () => {
    refetchAccounts();
    refetchVendors();
  };

  const value = {
    transactions,
    accounts,
    vendors,
    categories,
    isLoading: isLoadingTransactions || isLoadingAccounts || isLoadingVendors || isLoadingCategories,
    isLoadingTransactions,
    isLoadingAccounts,
    isLoadingVendors,
    isLoadingCategories,
    error: transactionsError || accountsError || vendorsError || categoriesError,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    accountCurrencyMap,
    generateDiverseDemoData,
    clearAllTransactions,
    demoDataProgress,
    refetchTransactions,
    refetchAccounts,
    refetchVendors,
    refetchCategories,
    refetchAllPayees,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};