import React, { createContext, useContext, ReactNode, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Payee, Category } from '@/types/finance';
import { createTransactionsService } from '@/services/transactionsService';
import { createPayeesService } from '@/services/payeesService';
import { createCategoriesService } from '@/services/categoriesService';
import { useUser } from '@/hooks/useUser';

const transactionsService = createTransactionsService(supabase);
const payeesService = createPayeesService(supabase);

interface TransactionsContextType {
  transactions: any[];
  accounts: Payee[];
  vendors: Payee[];
  categories: Category[];
  
  isLoadingTransactions: boolean;
  isLoadingAccounts: boolean;
  isLoadingVendors: boolean;
  isLoadingCategories: boolean;

  refetchTransactions: () => void;
  refetchAccounts: () => void;
  refetchVendors: () => void;
  refetchCategories: () => void;

  accountCurrencyMap: Map<string, string>;
  
  addTransaction: (transaction: any) => Promise<void>;
  updateTransaction: (id: string, updates: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteMultipleTransactions: (ids: string[]) => Promise<void>;

  addPayee: (payee: Omit<Payee, 'id'>) => Promise<void>;
  updatePayee: (id: string, updates: Partial<Payee>) => Promise<void>;
  deletePayee: (id: string) => Promise<void>;
  
  addCategory: (category: { name: string }) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  generateDiverseDemoData: () => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  
  invalidateAllData: () => void;
  demoDataProgress: { progress: number; message: string } | null;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const categoriesService = createCategoriesService(supabase, user?.id);
  const [demoDataProgress, setDemoDataProgress] = useState<{ progress: number; message: string } | null>(null);


  const invalidateAllData = () => {
    queryClient.invalidateQueries();
  };

  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsService.getTransactions,
  });

  const { data: accounts = [], isLoading: isLoadingAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: payeesService.getAccounts,
  });

  const { data: vendors = [], isLoading: isLoadingVendors, refetch: refetchVendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: payeesService.getVendors,
  });

  const { data: categories = [], isLoading: isLoadingCategories, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
    enabled: !!user,
  });

  const accountCurrencyMap = useMemo(() => 
    new Map(accounts.map(acc => [acc.name, acc.currency || 'USD']))
  , [accounts]);

  const handleMutation = async (mutationFn: () => Promise<any>, queryKey: string) => {
    await mutationFn();
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  };
  
  const handlePayeeMutation = async (mutationFn: () => Promise<any>) => {
    await mutationFn();
    refetchAccounts();
    refetchVendors();
  };

  return (
    <TransactionsContext.Provider value={{
      transactions,
      accounts,
      vendors,
      categories,
      isLoadingTransactions,
      isLoadingAccounts,
      isLoadingVendors,
      isLoadingCategories,
      refetchTransactions,
      refetchAccounts,
      refetchVendors,
      refetchCategories,
      accountCurrencyMap,
      addTransaction: (t) => handleMutation(() => transactionsService.addTransaction(t), 'transactions'),
      updateTransaction: (id, u) => handleMutation(() => transactionsService.updateTransaction(id, u), 'transactions'),
      deleteTransaction: (id) => handleMutation(() => transactionsService.deleteTransaction(id), 'transactions'),
      deleteMultipleTransactions: (ids) => handleMutation(() => transactionsService.deleteMultipleTransactions(ids), 'transactions'),
      addPayee: (p) => handlePayeeMutation(() => payeesService.addPayee(p)),
      updatePayee: (id, u) => handlePayeeMutation(() => payeesService.updatePayee(id, u)),
      deletePayee: (id) => handlePayeeMutation(() => payeesService.deletePayee(id)),
      addCategory: (c) => handleMutation(() => categoriesService.addCategory(c), 'categories'),
      updateCategory: (id, u) => handleMutation(() => categoriesService.updateCategory(id, u), 'categories'),
      deleteCategory: (id) => handleMutation(() => categoriesService.deleteCategory(id), 'categories'),
      generateDiverseDemoData: async () => {
        await transactionsService.generateDiverseDemoData();
        invalidateAllData();
      },
      clearAllTransactions: async () => {
        await transactionsService.clearAllData();
        invalidateAllData();
      },
      invalidateAllData,
      demoDataProgress,
    }}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};