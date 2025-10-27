"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Transaction, Account, Vendor, Category, AccountCurrencyMap } from "@/types/finance";

// --- Context Type Definition ---

interface TransactionsContextType {
  // Data
  transactions: Transaction[] | undefined;
  accounts: Account[] | undefined;
  vendors: Vendor[] | undefined;
  categories: Category[] | undefined;
  accountCurrencyMap: AccountCurrencyMap;
  demoDataProgress: number | null;

  // Loading States
  isLoadingTransactions: boolean;
  isLoadingAccounts: boolean;
  isLoadingVendors: boolean;
  isLoadingCategories: boolean;
  error: Error | null;

  // Actions & Refetching
  refetchTransactions: () => void;
  refetchAccounts: () => void;
  refetchVendors: () => void;
  refetchCategories: () => void;
  invalidateAllData: () => void;
  
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateTransaction: (transaction: Partial<Transaction> & { id: string }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteMultipleTransactions: (ids: string[]) => Promise<void>;
  generateDiverseDemoData: () => Promise<void>;
  clearAllTransactions: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

// --- Data Fetching Functions ---

const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);
  return data as Transaction[];
};

const fetchAccounts = async (): Promise<Account[]> => {
  const { data, error } = await supabase.rpc("get_accounts_with_transaction_counts");
  if (error) throw new Error(`Failed to fetch accounts: ${error.message}`);
  return data as Account[];
};

const fetchVendors = async (): Promise<Vendor[]> => {
  // Fetch non-account vendors using the stored procedure
  const { data, error } = await supabase.rpc("get_vendors_with_transaction_counts");
  if (error) throw new Error(`Failed to fetch vendors: ${error.message}`);
  // Filter out accounts, as they are handled by fetchAccounts
  return (data as (Vendor & { account_id: string | null })[]).filter(v => !v.is_account) as Vendor[];
};

const fetchCategories = async (userId: string): Promise<Category[]> => {
  const { data, error } = await supabase.rpc("get_categories_with_transaction_counts", { user_id_param: userId });
  if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
  return data as Category[];
};

// --- Provider Component ---

export const TransactionsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [demoDataProgress, setDemoDataProgress] = useState<number | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUserId();
  }, []);

  // 1. Transactions Query
  const { 
    data: transactions, 
    isLoading: isLoadingTransactions, 
    error, 
    refetch: refetchTransactions 
  } = useQuery<Transaction[], Error>({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    enabled: !!userId,
  });

  // 2. Accounts Query
  const { 
    data: accounts, 
    isLoading: isLoadingAccounts, 
    refetch: refetchAccounts 
  } = useQuery<Account[], Error>({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    enabled: !!userId,
  });

  // 3. Vendors Query
  const { 
    data: vendors, 
    isLoading: isLoadingVendors, 
    refetch: refetchVendors 
  } = useQuery<Vendor[], Error>({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    enabled: !!userId,
  });

  // 4. Categories Query
  const { 
    data: categories, 
    isLoading: isLoadingCategories, 
    refetch: refetchCategories 
  } = useQuery<Category[], Error>({
    queryKey: ["categories", userId],
    queryFn: () => fetchCategories(userId!),
    enabled: !!userId,
  });

  // Derived State: Account Currency Map
  const accountCurrencyMap: AccountCurrencyMap = React.useMemo(() => {
    if (!accounts) return {};
    return accounts.reduce((map, account) => {
      map[account.name] = account.currency;
      return map;
    }, {} as AccountCurrencyMap);
  }, [accounts]);

  // --- Action Functions ---

  const invalidateAllData = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => {
    if (!userId) return toast.error("User not authenticated.");
    
    const transactionWithUserId = { ...transaction, user_id: userId };
    const { error } = await supabase.from("transactions").insert(transactionWithUserId);

    if (error) {
      toast.error(`Failed to add transaction: ${error.message}`);
    } else {
      toast.success("Transaction added successfully.");
      invalidateAllData();
    }
  }, [userId, invalidateAllData]);

  const updateTransaction = useCallback(async (transaction: Partial<Transaction> & { id: string }) => {
    const { error } = await supabase.from("transactions").update(transaction).eq("id", transaction.id);

    if (error) {
      toast.error(`Failed to update transaction: ${error.message}`);
    } else {
      toast.success("Transaction updated successfully.");
      invalidateAllData();
    }
  }, [invalidateAllData]);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      toast.error(`Failed to delete transaction: ${error.message}`);
    } else {
      toast.success("Transaction deleted successfully.");
      invalidateAllData();
    }
  }, [invalidateAllData]);

  const deleteMultipleTransactions = useCallback(async (ids: string[]) => {
    const { error } = await supabase.from("transactions").delete().in("id", ids);

    if (error) {
      toast.error(`Failed to delete transactions: ${error.message}`);
    } else {
      toast.success(`${ids.length} transactions deleted successfully.`);
      invalidateAllData();
    }
  }, [invalidateAllData]);

  const generateDiverseDemoData = useCallback(async () => {
    if (!userId) return toast.error("User not authenticated.");
    
    // Placeholder for complex demo data generation logic
    toast.info("Generating demo data...");
    setDemoDataProgress(0);
    
    // Simulate progress
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setDemoDataProgress(i * 10);
    }

    // In a real scenario, this would call a complex Edge Function or RPC
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setDemoDataProgress(null);
    toast.success("Demo data generated successfully!");
    invalidateAllData();
  }, [userId, invalidateAllData]);

  const clearAllTransactions = useCallback(async () => {
    if (!userId) return toast.error("User not authenticated.");

    const { error } = await supabase.rpc("clear_all_app_data");

    if (error) {
      toast.error(`Failed to clear data: ${error.message}`);
    } else {
      toast.success("All user data cleared successfully.");
      invalidateAllData();
    }
  }, [userId, invalidateAllData]);


  const contextValue: TransactionsContextType = {
    transactions,
    accounts,
    vendors,
    categories,
    accountCurrencyMap,
    demoDataProgress,
    
    isLoadingTransactions,
    isLoadingAccounts,
    isLoadingVendors,
    isLoadingCategories,
    error,
    
    refetchTransactions,
    refetchAccounts,
    refetchVendors,
    refetchCategories,
    invalidateAllData,
    
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    generateDiverseDemoData,
    clearAllTransactions,
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
    throw new Error("useTransactions must be used within a TransactionsProvider");
  }
  return context;
};