"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionDialog } from "@/components/transactions/TransactionDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { useCurrency } from "@/contexts/CurrencyContext";

export type Transaction = {
  id: string;
  date: string;
  account: string;
  currency: string;
  vendor: string | null;
  amount: number;
  remarks: string | null;
  category: string;
  created_at: string;
  user_id: string;
  is_scheduled_origin: boolean;
  recurrence_id: string | null;
  recurrence_frequency: string | null;
  recurrence_end_date: string | null;
};

export type ScheduledTransaction = {
  id: string;
  user_id: string;
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  frequency: string;
  remarks: string | null;
  created_at: string;
  last_processed_date: string | null;
  recurrence_end_date: string | null;
};

export type Account = {
  id: string;
  name: string;
  currency: string;
  starting_balance: number;
  remarks: string | null;
};

export type Category = {
  id: string;
  name: string;
  user_id: string;
};

export type Vendor = {
  id: string;
  name: string;
  is_account: boolean;
  account_id: string | null;
};

const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const fetchAccounts = async (): Promise<Account[]> => {
  const { data: vendorsData, error: vendorsError } = await supabase
    .from("vendors")
    .select("name, account_id")
    .eq("is_account", true);

  if (vendorsError) throw new Error(vendorsError.message);

  const accountIds = vendorsData.map((v) => v.account_id).filter(Boolean);

  if (accountIds.length === 0) return [];

  const { data: accountsData, error: accountsError } = await supabase
    .from("accounts")
    .select("id, currency, starting_balance, remarks")
    .in("id", accountIds);

  if (accountsError) throw new Error(accountsError.message);

  const accountsMap = new Map(accountsData.map((acc) => [acc.id, acc]));

  return vendorsData.map((vendor) => {
    const account = accountsMap.get(vendor.account_id!);
    return {
      id: vendor.account_id!,
      name: vendor.name,
      currency: account?.currency || "USD", // Default currency if not found
      starting_balance: account?.starting_balance || 0,
      remarks: account?.remarks || null,
    };
  });
};

const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase.from("categories").select("*");
  if (error) throw new Error(error.message);
  return data;
};

const fetchVendors = async (): Promise<Vendor[]> => {
  const { data, error } = await supabase.from("vendors").select("*").eq("is_account", false);
  if (error) throw new Error(error.message);
  return data;
};

const deleteTransaction = async (id: string) => {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

export default function Transactions() {
  const queryClient = useQueryClient();
  const { selectedCurrency } = useCurrency();

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  });
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: vendors = [], isLoading: isLoadingVendors } = useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  });

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [vendorFilter, setVendorFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const availableAccountOptions = useMemo(() => accounts.map((acc) => ({ value: acc.name, label: acc.name })), [accounts]);
  const availableCategoryOptions = useMemo(() => categories.map((cat) => ({ value: cat.name, label: cat.name })), [categories]);
  const availableVendorOptions = useMemo(() => vendors.map((ven) => ({ value: ven.name, label: ven.name })), [vendors]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const fromDate = dateRange?.from;
      const toDate = dateRange?.to;

      if (fromDate && transactionDate < fromDate) return false;
      if (toDate && transactionDate > toDate) return false;
      if (accountFilter && transaction.account !== accountFilter) return false;
      if (categoryFilter && transaction.category !== categoryFilter) return false;
      if (vendorFilter && transaction.vendor !== vendorFilter) return false;
      if (
        searchTerm &&
        !(
          transaction.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.account.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) {
        return false;
      }
      return true;
    });
  }, [transactions, dateRange, accountFilter, categoryFilter, vendorFilter, searchTerm]);

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction deleted successfully.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleResetFilters = () => {
    setDateRange(undefined);
    setAccountFilter("");
    setCategoryFilter("");
    setVendorFilter("");
    setSearchTerm("");
  };

  const handleOpenDialog = () => {
    setEditingTransaction(null);
    setIsTransactionDialogOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Transactions</h1>
        <Button onClick={handleOpenDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Transaction Filters</CardTitle>
          <CardDescription>Filter your transactions by various criteria.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionFilters
            dateRange={dateRange}
            onDateChange={setDateRange}
            accountFilter={accountFilter}
            onAccountFilterChange={setAccountFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            vendorFilter={vendorFilter}
            onVendorFilterChange={setVendorFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onResetFilters={handleResetFilters}
            accounts={accounts.map((acc) => acc.name)}
            categories={categories.map((cat) => cat.name)}
            vendors={vendors.map((ven) => ven.name)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>A list of all your financial transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={filteredTransactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoadingTransactions || isLoadingAccounts || isLoadingCategories || isLoadingVendors}
          />
        </CardContent>
      </Card>
      <TransactionDialog
        isOpen={isTransactionDialogOpen}
        setIsOpen={setIsTransactionDialogOpen}
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        vendors={vendors}
      />
    </div>
  );
}