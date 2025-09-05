import * as React from 'react';
import { Transaction } from '@/data/finance-data';
import { useTransactionsDb } from '@/hooks/useTransactionsDb'; // Import the new hook

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'transferId'> & { date: string }) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string, transferId?: string) => void;
  isLoading: boolean; // Add loading state
  isError: boolean;   // Add error state
  error: Error | null; // Add error object
}

const TransactionsContext = React.createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    isLoading,
    isError,
    error,
  } = useTransactionsDb(); // Use the new hook

  const value = React.useMemo(() => ({
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    isLoading,
    isError,
    error,
  }), [transactions, addTransaction, updateTransaction, deleteTransaction, isLoading, isError, error]);

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