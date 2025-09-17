import * as React from 'react';
import { Transaction, baseCategories } from '@/data/finance-data';
import { useCurrency } from './CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Payee } from '@/components/AddEditPayeeDialog';
import { createTransactionsService } from '@/services/transactionsService';
import { createDemoDataService } from '@/services/demoDataService';
import { Category } from '@/pages/Categories';
import { createCategoriesService } from '@/services/categoriesService';
import { useUser } from './UserContext';
import { createScheduledTransactionsService } from '@/services/scheduledTransactionsService';
import { useQuery, useMutation, useQueryClient, QueryObserverResult } from '@tanstack/react-query'; // Import QueryObserverResult

interface TransactionToDelete {
  id: string;
  transfer_id?: string;
}

interface DemoDataProgress {
  stage: string;
  progress: number;
  totalStages: number;
}

interface TransactionsContextType {
  transactions: Transaction[];
  vendors: Payee[];
  accounts: Payee[];
  categories: Category[];
  accountCurrencyMap: Map<string, string>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transfer_id' | 'user_id' | 'is_scheduled_origin'> & { date: string; receivingAmount?: number; recurrenceFrequency?: string; recurrenceEndDate?: string }) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string, transfer_id?: string) => void;
  deleteMultipleTransactions: (transactionsToDelete: TransactionToDelete[]) => void;
  clearAllTransactions: () => void;
  generateDiverseDemoData: () => void;
  fetchVendors: () => Promise<QueryObserverResult<Payee[], Error>>; // Updated return type
  fetchAccounts: () => Promise<QueryObserverResult<Payee[], Error>>; // Updated return type
  fetchCategories: () => Promise<QueryObserverResult<Category[], Error>>; // Updated return type
  refetchAllPayees: () => Promise<void>;
  fetchTransactions: () => Promise<QueryObserverResult<Transaction[], Error>>; // Updated return type
  demoDataProgress: DemoDataProgress | null;
  processScheduledTransactions: () => Promise<void>;
  isLoadingTransactions: boolean; // New loading state from react-query
  isLoadingVendors: boolean;
  isLoadingAccounts: boolean;
  isLoadingCategories: boolean;
}

export const TransactionsContext = React.createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { convertAmount, convertBetweenCurrencies } = useCurrency();
  const { user, isLoadingUser } = useUser(); // Keep this for enabling queries
  const [accountCurrencyMap, setAccountCurrencyMap] = React.useState<Map<string, string>>(new Map());
  const [demoDataProgress, setDemoDataProgress] = React.useState<DemoDataProgress | null>(null);

  // --- Data Fetching with react-query ---

  // Fetch Transactions
  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useQuery<Transaction[], Error>({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*, is_scheduled_origin, recurrence_id, recurrence_frequency, recurrence_end_date')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user?.id && !isLoadingUser, // Only run query if user is logged in and not loading
  });

  // Fetch Vendors
  const { data: vendors = [], isLoading: isLoadingVendors, refetch: refetchVendors } = useQuery<Payee[], Error>({
    queryKey: ['vendors', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.rpc('get_vendors_with_transaction_counts');
      if (error) throw error;
      return data.map((item: any) => ({
        id: item.id, name: item.name, is_account: item.is_account, created_at: item.created_at,
        account_id: item.account_id, currency: item.currency, starting_balance: item.starting_balance,
        remarks: item.remarks, running_balance: item.running_balance, totalTransactions: item.total_transactions || 0,
      })) as Payee[];
    },
    enabled: !!user?.id && !isLoadingUser,
  });

  // Fetch Accounts
  const { data: accounts = [], isLoading: isLoadingAccounts, refetch: refetchAccounts } = useQuery<Payee[], Error>({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.rpc('get_accounts_with_transaction_counts');
      if (error) throw error;
      return data.map((item: any) => ({
        id: item.id, name: item.name, is_account: item.is_account, created_at: item.created_at,
        account_id: item.account_id, currency: item.currency, starting_balance: item.starting_balance,
        remarks: item.remarks, running_balance: item.running_balance, totalTransactions: item.total_transactions || 0,
      })) as Payee[];
    },
    enabled: !!user?.id && !isLoadingUser,
  });

  // Fetch Categories
  const { data: categories = [], isLoading: isLoadingCategories, refetch: refetchCategories } = useQuery<Category[], Error>({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Ensure default categories for the user
      await supabase.rpc('ensure_default_categories_for_user', { p_user_id: user.id });

      const { data, error } = await supabase
        .rpc('get_categories_with_transaction_counts', { user_id_param: user.id });
      if (error) throw error;
      return data.map((item: any) => ({
        id: item.id, name: item.name, user_id: item.user_id, created_at: item.created_at, totalTransactions: item.total_transactions || 0,
      })) as Category[];
    },
    enabled: !!user?.id && !isLoadingUser,
  });

  // Effect to update accountCurrencyMap when accounts change
  React.useEffect(() => {
    const newMap = new Map<string, string>();
    accounts.forEach(account => {
      if (account.name && account.currency) {
        newMap.set(account.name, account.currency);
      }
    });
    setAccountCurrencyMap(newMap);
  }, [accounts]);

  // --- Mutations with react-query ---

  const invalidateAllTransactionRelatedQueries = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    await queryClient.invalidateQueries({ queryKey: ['vendors'] });
    await queryClient.invalidateQueries({ queryKey: ['accounts'] });
    await queryClient.invalidateQueries({ queryKey: ['categories'] });
    await queryClient.invalidateQueries({ queryKey: ['scheduledTransactions'] });
  }, [queryClient]);

  const { addTransaction, updateTransaction, deleteTransaction, deleteMultipleTransactions } = React.useMemo(() => createTransactionsService({
    fetchTransactions: refetchTransactions, // Pass react-query's refetch
    refetchAllPayees: invalidateAllTransactionRelatedQueries, // Invalidate all relevant queries
    transactions,
    convertBetweenCurrencies,
    userId: user?.id,
  }), [refetchTransactions, invalidateAllTransactionRelatedQueries, transactions, convertBetweenCurrencies, user?.id]);

  const { clearAllTransactions, generateDiverseDemoData } = React.useMemo(() => createDemoDataService({
    fetchTransactions: refetchTransactions,
    refetchAllPayees: invalidateAllTransactionRelatedQueries,
    // Removed direct state setters as react-query manages state
    setDemoDataProgress,
    userId: user?.id,
  }), [refetchTransactions, invalidateAllTransactionRelatedQueries, setDemoDataProgress, user?.id]);

  const { processScheduledTransactions } = React.useMemo(() => createScheduledTransactionsService({
    fetchTransactions: refetchTransactions,
    userId: user?.id,
  }), [refetchTransactions, user?.id]);

  // --- Auth State Change Handling ---
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        queryClient.invalidateQueries(); // Invalidate all queries on sign-in
        processScheduledTransactions(); // Process scheduled transactions on sign-in
      } else if (event === 'SIGNED_OUT') {
        queryClient.clear(); // Clear all react-query cache on sign-out
        setAccountCurrencyMap(new Map());
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient, processScheduledTransactions]); // Add processScheduledTransactions to dependencies

  const value = React.useMemo(() => ({
    transactions,
    vendors,
    accounts,
    categories,
    accountCurrencyMap,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    clearAllTransactions,
    generateDiverseDemoData,
    fetchVendors: refetchVendors, // Expose refetch functions
    fetchAccounts: refetchAccounts,
    fetchCategories: refetchCategories,
    refetchAllPayees: invalidateAllTransactionRelatedQueries,
    fetchTransactions: refetchTransactions,
    demoDataProgress,
    processScheduledTransactions,
    isLoadingTransactions,
    isLoadingVendors,
    isLoadingAccounts,
    isLoadingCategories,
  }), [
    transactions, vendors, accounts, categories, accountCurrencyMap,
    addTransaction, updateTransaction, deleteTransaction, deleteMultipleTransactions,
    clearAllTransactions, generateDiverseDemoData,
    refetchVendors, refetchAccounts, refetchCategories, invalidateAllTransactionRelatedQueries, refetchTransactions,
    demoDataProgress, processScheduledTransactions,
    isLoadingTransactions, isLoadingVendors, isLoadingAccounts, isLoadingCategories,
  ]);

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => {
  const context = React.useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};