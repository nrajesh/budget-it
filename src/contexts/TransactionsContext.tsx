import * as React from 'react';
import { Transaction } from '@/data/finance-data';
import { useCurrency } from './CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Payee } from '@/components/AddEditPayeeDialog';
import { createTransactionsService } from '@/services/transactionsService';
import { createPayeesService } from '@/services/payeesService';
import { createDemoDataService } from '@/services/demoDataService';

interface TransactionToDelete {
  id: string;
  transfer_id?: string;
}

interface TransactionsContextType {
  transactions: Transaction[];
  vendors: Payee[];
  accounts: Payee[];
  accountCurrencyMap: Map<string, string>; // Added accountCurrencyMap
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transfer_id'> & { date: string }) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string, transfer_id?: string) => void;
  deleteMultipleTransactions: (transactionsToDelete: TransactionToDelete[]) => void;
  clearAllTransactions: () => void;
  generateDiverseDemoData: () => void;
  fetchVendors: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  refetchAllPayees: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
}

const TransactionsContext = React.createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { convertAmount } = useCurrency();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [vendors, setVendors] = React.useState<Payee[]>([]);
  const [accounts, setAccounts] = React.useState<Payee[]>([]);
  const [accountCurrencyMap, setAccountCurrencyMap] = React.useState<Map<string, string>>(new Map()); // Initialize map
  const [isLoading, setIsLoading] = React.useState(true);

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
    await Promise.all([fetchVendors(), fetchAccounts(), fetchTransactions()]);
  }, [fetchVendors, fetchAccounts, fetchTransactions]);

  const { addTransaction, updateTransaction, deleteTransaction, deleteMultipleTransactions } = React.useMemo(() => createTransactionsService({
    fetchTransactions,
    refetchAllPayees,
    transactions,
  }), [fetchTransactions, refetchAllPayees, transactions]);

  const { clearAllTransactions, generateDiverseDemoData } = React.useMemo(() => createDemoDataService({
    fetchTransactions,
    refetchAllPayees,
    setTransactions,
    setVendors,
    setAccounts,
  }), [fetchTransactions, refetchAllPayees, setTransactions, setVendors, setAccounts]);

  React.useEffect(() => {
    fetchTransactions();
    refetchAllPayees();
  }, [fetchTransactions, refetchAllPayees]);

  const value = React.useMemo(() => ({
    transactions,
    vendors,
    accounts,
    accountCurrencyMap, // Include map in context value
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    clearAllTransactions,
    generateDiverseDemoData,
    fetchVendors,
    fetchAccounts,
    refetchAllPayees,
    fetchTransactions,
  }), [
    transactions,
    vendors,
    accounts,
    accountCurrencyMap, // Add to dependencies
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    clearAllTransactions,
    generateDiverseDemoData,
    fetchVendors,
    fetchAccounts,
    refetchAllPayees,
    fetchTransactions,
  ]);

  if (isLoading) {
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