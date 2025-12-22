import React, { createContext, useContext, ReactNode } from 'react';
import { useUser } from './UserContext';
import { Transaction, ScheduledTransaction } from '@/types/transaction';
import { Category } from '@/types/category';
import { Payee } from '@/types/payee';

interface TransactionsContextType {
  transactions: Transaction[];
  scheduledTransactions: ScheduledTransaction[];
  accounts: Payee[];
  vendors: Payee[];
  categories: Category[];
  
  isLoadingTransactions: boolean;
  isLoadingScheduledTransactions: boolean;
  isLoadingAccounts: boolean;
  isLoadingVendors: boolean;
  isLoadingCategories: boolean;
  
  // Fixed type to Map for .has/.get methods
  accountCurrencyMap: Map<string, string>; 
  demoDataProgress: number | null; // Added

  // CRUD/Refetch functions
  addTransaction: (data: any) => Promise<void>;
  updateTransaction: (id: string, data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteMultipleTransactions: (ids: string[]) => Promise<void>; // Added
  
  generateDiverseDemoData: () => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  
  // Refetch functions
  refetchTransactions: () => void;
  refetchScheduledTransactions: () => void;
  refetchVendors: () => void;
  refetchAccounts: () => void;
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
    
    accountCurrencyMap: new Map(), // Initialized as Map
    demoDataProgress: null,
    
    addTransaction: async () => console.log('Add transaction placeholder'),
    updateTransaction: async () => console.log('Update transaction placeholder'),
    deleteTransaction: async () => console.log('Delete transaction placeholder'),
    deleteMultipleTransactions: async () => console.log('Delete multiple transactions placeholder'),
    
    generateDiverseDemoData: async () => console.log('Generate demo data placeholder'),
    clearAllTransactions: async () => console.log('Clear data placeholder'),
    
    refetchTransactions: () => console.log('Refetch transactions placeholder'),
    refetchScheduledTransactions: () => console.log('Refetch scheduled transactions placeholder'),
    refetchVendors: () => console.log('Refetch vendors placeholder'),
    refetchAccounts: () => console.log('Refetch accounts placeholder'),
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