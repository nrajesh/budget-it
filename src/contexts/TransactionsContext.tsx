import * as React from 'react';
import { Transaction, baseCategories } from '@/data/finance-data'; // Import baseCategories
import { useCurrency } from './CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Payee } from '@/components/AddEditPayeeDialog';
import { createTransactionsService } from '@/services/transactionsService';
import { createPayeesService } from '@/services/payeesService';
import { createDemoDataService } from '@/services/demoDataService';
import { Category } from '@/pages/Categories'; // Import Category type
import { createCategoriesService } from '@/services/categoriesService'; // Import new service
import { useUser } from './UserContext'; // Import useUser

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
  categories: Category[]; // Add categories to context type
  accountCurrencyMap: Map<string, string>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transfer_id'> & { date: string }) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string, transfer_id?: string) => void;
  deleteMultipleTransactions: (transactionsToDelete: TransactionToDelete[]) => void;
  clearAllTransactions: () => void;
  generateDiverseDemoData: () => void;
  fetchVendors: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchCategories: () => Promise<void>; // Add fetchCategories to context type
  refetchAllPayees: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  demoDataProgress: DemoDataProgress | null;
}

export const TransactionsContext = React.createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { convertAmount, convertBetweenCurrencies } = useCurrency();
  const { user } = useUser(); // Get user from UserContext
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [vendors, setVendors] = React.useState<Payee[]>([]);
  const [accounts, setAccounts] = React.useState<Payee[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]); // New state for categories
  const [accountCurrencyMap, setAccountCurrencyMap] = React.useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = React.useState(true);
  const [demoDataProgress, setDemoDataProgress] = React.useState<DemoDataProgress | null>(null);

  const fetchTransactions = React.useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      showError(`Failed to fetch transactions: ${error.message}`);
      setTransactions([]);
    } else {
      setTransactions(data as Transaction[]);
    }
    setIsLoading(false);
  }, []);

  const { fetchVendors, fetchAccounts } = React.useMemo(() => createPayeesService({
    setVendors,
    setAccounts,
    convertAmount,
  }), [setVendors, setAccounts, convertAmount]);

  // Pass a getter function for transactions to createCategoriesService
  const { fetchCategories } = React.useMemo(() => createCategoriesService({
    setCategories,
    userId: user?.id, // Pass userId to categories service
    getTransactions: () => transactions, // Pass getter function for transactions
  }), [setCategories, user?.id]); // fetchCategories is now stable because `transactions` is not a direct dependency of its creation

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

  const refetchAllPayees = React.useCallback(async () => {
    // Ensure transactions are fetched first if categories depend on them
    await fetchTransactions(); // Fetch transactions first
    await Promise.all([fetchVendors(), fetchAccounts(), fetchCategories()]); // Then fetch payees and categories
  }, [fetchVendors, fetchAccounts, fetchCategories, fetchTransactions]); // Dependencies are stable functions

  const { addTransaction, updateTransaction, deleteTransaction, deleteMultipleTransactions } = React.useMemo(() => createTransactionsService({
    fetchTransactions,
    refetchAllPayees,
    transactions, // This is fine here, as transactionsService doesn't cause a loop back to its own creation
    setTransactions,
    convertBetweenCurrencies,
    userId: user?.id, // Pass userId to transactions service
  }), [fetchTransactions, refetchAllPayees, transactions, setTransactions, convertBetweenCurrencies, user?.id]);

  const { clearAllTransactions, generateDiverseDemoData } = React.useMemo(() => createDemoDataService({
    fetchTransactions,
    refetchAllPayees,
    setTransactions,
    setVendors,
    setAccounts,
    setCategories, // Pass setCategories
    setDemoDataProgress,
    userId: user?.id, // Pass userId
  }), [fetchTransactions, refetchAllPayees, setTransactions, setVendors, setAccounts, setCategories, setDemoDataProgress, user?.id]);

  React.useEffect(() => {
    if (user?.id) { // Only fetch data if user is logged in
      // Initial fetch: fetch transactions first, then other data that might depend on them
      const initialLoad = async () => {
        await fetchTransactions(); // This updates `transactions` state
        // Now `fetchCategories` is stable, so calling it here won't cause a re-render loop
        await Promise.all([fetchVendors(), fetchAccounts(), fetchCategories()]);
      };
      initialLoad();

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          const authChangeLoad = async () => {
            await fetchTransactions();
            await Promise.all([fetchVendors(), fetchAccounts(), fetchCategories()]);
          };
          authChangeLoad();
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // Clear data if user logs out
      setTransactions([]);
      setVendors([]);
      setAccounts([]);
      setCategories([]);
      setAccountCurrencyMap(new Map());
      setIsLoading(false);
    }
  }, [fetchTransactions, fetchVendors, fetchAccounts, fetchCategories, user?.id]); // All dependencies are now stable functions or primitive values.

  const value = React.useMemo(() => ({
    transactions,
    vendors,
    accounts,
    categories, // Include categories in context value
    accountCurrencyMap,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    clearAllTransactions,
    generateDiverseDemoData,
    fetchVendors,
    fetchAccounts,
    fetchCategories, // Include fetchCategories in context value
    refetchAllPayees,
    fetchTransactions,
    setTransactions,
    demoDataProgress,
  }), [
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
    fetchVendors,
    fetchAccounts,
    fetchCategories,
    refetchAllPayees,
    fetchTransactions,
    setTransactions,
    demoDataProgress,
  ]);

  if (isLoading && user?.id) { // Only show loading spinner if user is logged in and data is being fetched
    return <div className="flex items-center justify-center min-h-screen">Loading transactions...</div>;
  }

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