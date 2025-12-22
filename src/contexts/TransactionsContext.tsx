import React, { createContext, useContext, ReactNode } from 'react';
import { useUser } from './UserContext';

// Placeholder types
interface Transaction { id: string; date: string; amount: number; }
interface Account { id: string; name: string; currency: string; starting_balance: number; running_balance: number; }
interface Category { id: string; name: string; }
interface Payee { id: string; name: string; }

interface TransactionsContextType {
  transactions: Transaction[];
  scheduledTransactions: Transaction[];
  accounts: Account[];
  vendors: Payee[];
  categories: Category[];
  isLoadingTransactions: boolean;
  isLoadingScheduledTransactions: boolean;
  isLoadingAccounts: boolean;
  isLoadingVendors: boolean;
  isLoadingCategories: boolean;
  accountCurrencyMap: Record<string, string>;
  addTransaction: (data: any) => Promise<void>;
  updateTransaction: (id: string, data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  generateDiverseDemoData: () => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  refetchCategories: () => void;
  invalidateAllData: () => void;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading: isLoadingUser } = useUser();

  // Placeholder implementation for all required values
  const contextValue: TransactionsContextType = {
    transactions: [],
    scheduledTransactions: [],
    accounts: [],
    vendors: [],
    categories: [],
    isLoadingTransactions: isLoadingUser,
    isLoadingScheduledTransactions: isLoadingUser,
    isLoadingAccounts: isLoadingUser,
    isLoadingVendors: isLoadingUser,
    isLoadingCategories: isLoadingUser,
    accountCurrencyMap: {},
    addTransaction: async () => console.log('Add transaction placeholder'),
    updateTransaction: async () => console.log('Update transaction placeholder'),
    deleteTransaction: async () => console.log('Delete transaction placeholder'),
    generateDiverseDemoData: async () => console.log('Generate demo data placeholder'),
    clearAllTransactions: async () => console.log('Clear data placeholder'),
    refetchCategories: () => console.log('Refetch categories placeholder'),
    invalidateAllData: () => console.log('Invalidate all data placeholder'),
  };

  return (
    <TransactionsContext.Provider value={contextValue}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = (): TransactionsContextType => {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};