"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

// Define extended Transaction interface
export interface Transaction {
  id: string;
  date: string;
  account: string;
  vendor: string | null;
  category: string;
  amount: number;
  remarks?: string | null;
  currency: string;
  created_at: string; // Made required as per schema
  user_id: string; // Made required as per schema
  transfer_id?: string | null;
  is_scheduled_origin?: boolean;
  recurrence_id?: string | null;
  recurrence_frequency?: string | null;
  recurrence_end_date?: string | null;
}

// Define Payee (Vendor/Account) interface
export interface Payee {
  id: string;
  name: string;
  is_account: boolean;
  account_id?: string | null;
  currency?: string; // For accounts
  starting_balance?: number; // For accounts
  remarks?: string | null; // For accounts
  created_at?: string;
}

// Define Category interface
export interface Category {
  id: string;
  name: string;
  user_id: string;
  created_at?: string;
}

// Define ScheduledTransaction interface
export interface ScheduledTransaction {
  id: string;
  user_id: string;
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  frequency: string;
  remarks?: string | null;
  created_at?: string;
  last_processed_date?: string | null;
  recurrence_end_date?: string | null;
}

// Define Budget interface
export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  currency: string;
  target_amount: number;
  start_date: string;
  frequency: string;
  end_date?: string | null;
  is_active: boolean;
  created_at?: string;
}

interface TransactionsContextType {
  transactions: Transaction[] | undefined;
  isLoadingTransactions: boolean;
  saveTransaction: (transaction: Partial<Transaction>) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateTransaction: (transaction: Partial<Transaction> & { id: string }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteMultipleTransactions: (ids: string[]) => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  selectedAccount: string | undefined;
  setSelectedAccount: (account: string | undefined) => void;
  selectedCategory: string | undefined;
  setSelectedCategory: (category: string | undefined) => void;
  selectedVendor: string | undefined;
  setSelectedVendor: (vendor: string | undefined) => void;
  handleRefresh: () => void;
  handleResetFilters: () => void;
  accounts: Payee[] | undefined;
  isLoadingAccounts: boolean;
  categories: Category[] | undefined;
  isLoadingCategories: boolean;
  vendors: Payee[] | undefined;
  isLoadingVendors: boolean;
  accountCurrencyMap: Record<string, string>;
  invalidateAllData: () => void;
  refetchTransactions: () => void;
  refetchAccounts: () => void;
  refetchCategories: () => void;
  refetchVendors: () => void;
  demoDataProgress: number | null;
  generateDiverseDemoData: () => Promise<void>;
  clearAllTransactions: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(
  undefined
);

export const TransactionsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(
    undefined
  );
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [selectedVendor, setSelectedVendor] = useState<string | undefined>(
    undefined
  );
  const [demoDataProgress, setDemoDataProgress] = useState<number | null>(null);

  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
  } = useQuery<Transaction[]>({
    queryKey: [
      "transactions",
      dateRange,
      selectedAccount,
      selectedCategory,
      selectedVendor,
      searchTerm,
    ],
    queryFn: async () => {
      let query = supabase.from("transactions").select("*");

      if (dateRange?.from) {
        query = query.gte("date", format(dateRange.from, "yyyy-MM-dd"));
      }
      if (dateRange?.to) {
        query = query.lte("date", format(dateRange.to, "yyyy-MM-dd"));
      }
      if (selectedAccount) {
        query = query.eq("account", selectedAccount);
      }
      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }
      if (selectedVendor) {
        query = query.eq("vendor", selectedVendor);
      }
      if (searchTerm) {
        query = query.or(
          `vendor.ilike.%${searchTerm}%,remarks.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query.order("date", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const {
    data: accounts,
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = useQuery<Payee[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name, is_account, account_id, accounts(currency, starting_balance, remarks, created_at)")
        .eq("is_account", true);
      if (error) throw error;
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        is_account: item.is_account,
        account_id: item.account_id,
        currency: item.accounts?.currency,
        starting_balance: item.accounts?.starting_balance,
        remarks: item.accounts?.remarks,
        created_at: item.accounts?.created_at,
      })) as Payee[];
    },
  });

  const {
    data: categories,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, user_id, created_at");
      if (error) throw error;
      return data as Category[];
    },
  });

  const {
    data: vendors,
    isLoading: isLoadingVendors,
    refetch: refetchVendors,
  } = useQuery<Payee[]>({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name, is_account, created_at")
        .eq("is_account", false);
      if (error) throw error;
      return data as Payee[];
    },
  });

  const accountCurrencyMap = useMemo(() => {
    if (!accounts) return {};
    return accounts.reduce((map, acc) => {
      if (acc.is_account && acc.currency) {
        map[acc.name] = acc.currency;
      }
      return map;
    }, {} as Record<string, string>);
  }, [accounts]);

  const invalidateAllData = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["vendors"] });
    queryClient.invalidateQueries({ queryKey: ["scheduled_transactions"] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  };

  const saveTransactionMutation = useMutation({
    mutationFn: async (newTransaction: Partial<Transaction>) => {
      if (newTransaction.id) {
        const { data, error } = await supabase
          .from("transactions")
          .update(newTransaction)
          .eq("id", newTransaction.id)
          .select();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("transactions")
          .insert(newTransaction)
          .select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      invalidateAllData();
      toast.success("Transaction saved successfully.");
    },
    onError: (error) => {
      toast.error("Failed to save transaction.");
      console.error("Transaction mutation error:", error);
    },
  });

  const saveTransaction = async (transaction: Partial<Transaction>) => {
    await saveTransactionMutation.mutateAsync(transaction);
  };

  const addTransaction = async (newTransaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => {
    await saveTransactionMutation.mutateAsync(newTransaction);
  };

  const updateTransaction = async (updatedTransaction: Partial<Transaction> & { id: string }) => {
    await saveTransactionMutation.mutateAsync(updatedTransaction);
  };

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllData();
      toast.success("Transaction deleted successfully.");
    },
    onError: (error) => {
      toast.error("Failed to delete transaction.");
      console.error("Delete transaction error:", error);
    },
  });

  const deleteTransaction = async (id: string) => {
    await deleteTransactionMutation.mutateAsync(id);
  };

  const deleteMultipleTransactionsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("transactions").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllData();
      toast.success("Selected transactions deleted successfully.");
    },
    onError: (error) => {
      toast.error("Failed to delete selected transactions.");
      console.error("Delete multiple transactions error:", error);
    },
  });

  const deleteMultipleTransactions = async (ids: string[]) => {
    await deleteMultipleTransactionsMutation.mutateAsync(ids);
  };

  const handleRefresh = () => {
    invalidateAllData();
    toast.info("Data refreshed.");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setDateRange(undefined);
    setSelectedAccount(undefined);
    setSelectedCategory(undefined);
    setSelectedVendor(undefined);
    invalidateAllData();
    toast.info("Filters reset.");
  };

  const generateDiverseDemoData = async () => {
    toast.info("Generating demo data (placeholder)...");
    setDemoDataProgress(0);
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setDemoDataProgress(i);
    }
    setDemoDataProgress(null);
    invalidateAllData();
    toast.success("Demo data generated (placeholder).");
  };

  const clearAllTransactions = async () => {
    toast.info("Clearing all transactions (placeholder)...");
    // In a real app, you'd call a Supabase function or perform deletions
    // For now, just invalidate queries
    invalidateAllData();
    toast.success("All transactions cleared (placeholder).");
  };

  const value = {
    transactions,
    isLoadingTransactions,
    saveTransaction,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    selectedAccount,
    setSelectedAccount,
    selectedCategory,
    setSelectedCategory,
    selectedVendor,
    setSelectedVendor,
    handleRefresh,
    handleResetFilters,
    accounts,
    isLoadingAccounts,
    categories,
    isLoadingCategories,
    vendors,
    isLoadingVendors,
    accountCurrencyMap,
    invalidateAllData,
    refetchTransactions,
    refetchAccounts,
    refetchCategories,
    refetchVendors,
    demoDataProgress,
    generateDiverseDemoData,
    clearAllTransactions,
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
    throw new Error(
      "useTransactions must be used within a TransactionsProvider"
    );
  }
  return context;
};