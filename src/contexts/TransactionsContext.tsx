import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/transaction';
import { Category } from '@/types/category';
import { Payee } from '@/types/payee';

interface TransactionsContextType {
  transactions: Transaction[];
  scheduledTransactions: Transaction[];
  categories: Category[];
  accounts: Payee[];
  vendors: Payee[];
  accountCurrencyMap: Map<string, string>;
  isLoadingTransactions: boolean;
  isLoadingScheduledTransactions: boolean;
  isLoadingCategories: boolean;
  isLoadingAccounts: boolean;
  isLoadingVendors: boolean;
  demoDataProgress: { progress: number; totalStages: number; stage: string } | null;
  fetchTransactions: () => Promise<void>;
  fetchScheduledTransactions: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchVendors: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string, transferId?: string | null) => Promise<void>;
  deleteMultipleTransactions: (ids: string[]) => Promise<void>;
  refetchTransactions: () => Promise<void>;
  refetchScheduledTransactions: () => Promise<void>;
  refetchCategories: () => Promise<void>;
  refetchAccounts: () => Promise<void>;
  refetchVendors: () => Promise<void>;
  invalidateAllData: () => void;
  generateDiverseDemoData: () => Promise<void>;
  clearAllTransactions: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scheduledTransactions, setScheduledTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Payee[]>([]);
  const [vendors, setVendors] = useState<Payee[]>([]);
  const [accountCurrencyMap, setAccountCurrencyMap] = useState<Map<string, string>>(new Map());
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isLoadingScheduledTransactions, setIsLoadingScheduledTransactions] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [demoDataProgress, setDemoDataProgress] = useState<{ progress: number; totalStages: number; stage: string } | null>(null);

  // Implement all the functions with proper types
  const fetchTransactions = async () => {
    // Implementation
  };

  const fetchScheduledTransactions = async () => {
    // Implementation
  };

  const fetchCategories = async () => {
    // Implementation
  };

  const fetchAccounts = async () => {
    // Implementation
  };

  const fetchVendors = async () => {
    // Implementation
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    // Implementation
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    // Implementation
  };

  const deleteTransaction = async (id: string, transferId?: string | null) => {
    // Implementation
  };

  const deleteMultipleTransactions = async (ids: string[]) => {
    // Implementation
  };

  const refetchTransactions = async () => {
    // Implementation
  };

  const refetchScheduledTransactions = async () => {
    // Implementation
  };

  const refetchCategories = async () => {
    // Implementation
  };

  const refetchAccounts = async () => {
    // Implementation
  };

  const refetchVendors = async () => {
    // Implementation
  };

  const invalidateAllData = () => {
    // Implementation
  };

  const generateDiverseDemoData = async () => {
    // Implementation
  };

  const clearAllTransactions = async () => {
    // Implementation
  };

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        scheduledTransactions,
        categories,
        accounts,
        vendors,
        accountCurrencyMap,
        isLoadingTransactions,
        isLoadingScheduledTransactions,
        isLoadingCategories,
        isLoadingAccounts,
        isLoadingVendors,
        demoDataProgress,
        fetchTransactions,
        fetchScheduledTransactions,
        fetchCategories,
        fetchAccounts,
        fetchVendors,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteMultipleTransactions,
        refetchTransactions,
        refetchScheduledTransactions,
        refetchCategories,
        refetchAccounts,
        refetchVendors,
        invalidateAllData,
        generateDiverseDemoData,
        clearAllTransactions
      }}
    >
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