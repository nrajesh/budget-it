"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Account, type Category, type Vendor, type Transaction, type ScheduledTransaction, type Budget } from "@/pages/Transactions"; // Import all types from Transactions page
import { useCurrency } from "@/contexts/CurrencyContext"; // Import useCurrency

// Define the type for the filter parameters
interface FilterParams {
  dateRange: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  accountFilter: string;
  onAccountFilterChange: (account: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  vendorFilter: string;
  onVendorFilterChange: (vendor: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onResetFilters: () => void;
  accounts: string[]; // Names for dropdowns
  categories: string[]; // Names for dropdowns
  vendors: string[]; // Names for dropdowns
}

// New interface for the data passed to the children render prop
export interface ReportChildrenProps extends FilterParams {
  historicalFilteredTransactions: Transaction[];
  combinedFilteredTransactions: Transaction[]; // This will include historical and future within range
  futureFilteredTransactions: ScheduledTransaction[]; // Only scheduled transactions
  allAccounts: Account[]; // Full account objects
  allCategories: Category[]; // Full category objects
  allVendors: Vendor[]; // Full vendor objects
  budgets: Budget[];
}

interface ReportLayoutProps {
  title: string;
  description: string | React.ReactNode;
  children: (data: ReportChildrenProps) => React.ReactNode; // Children is now a render prop with full data
}

const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const fetchScheduledTransactions = async (): Promise<ScheduledTransaction[]> => {
  const { data, error } = await supabase.from("scheduled_transactions").select("*").order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const fetchBudgets = async (): Promise<Budget[]> => {
  const { data, error } = await supabase.from("budgets").select("*");
  if (error) throw new Error(error.message);
  return data;
};

const fetchAccounts = async (): Promise<Account[]> => {
  const { data: vendorsData, error: vendorsError } = await supabase
    .from("vendors")
    .select("name, account_id, accounts(currency, starting_balance)")
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


export default function ReportLayout({ children, title, description }: ReportLayoutProps) {
  const { selectedCurrency } = useCurrency();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [vendorFilter, setVendorFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: allTransactions = [], isLoading: isLoadingAllTransactions } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  });
  const { data: allScheduledTransactions = [], isLoading: isLoadingAllScheduledTransactions } = useQuery<ScheduledTransaction[]>({
    queryKey: ["scheduled_transactions"],
    queryFn: fetchScheduledTransactions,
  });
  const { data: allBudgets = [], isLoading: isLoadingBudgets } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: fetchBudgets,
  });
  const { data: allAccounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });
  const { data: allCategories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: allVendors = [], isLoading: isLoadingVendors } = useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  });

  const handleResetFilters = () => {
    setDateRange(undefined);
    setAccountFilter("");
    setCategoryFilter("");
    setVendorFilter("");
    setSearchTerm("");
  };

  const { historicalFilteredTransactions, combinedFilteredTransactions, futureFilteredTransactions } = useMemo(() => {
    const fromDate = dateRange?.from ? new Date(dateRange.from) : null;
    const toDate = dateRange?.to ? new Date(dateRange.to) : null;

    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(23, 59, 59, 999);

    const applyFilters = (item: Transaction | ScheduledTransaction) => {
      const itemDate = new Date(item.date);
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      if (accountFilter && item.account !== accountFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      
      // Vendor filter for Transaction and ScheduledTransaction
      const itemVendor = (item as Transaction).vendor || (item as ScheduledTransaction).vendor;
      if (vendorFilter && itemVendor !== vendorFilter) return false; 

      if (
        searchTerm &&
        !(
          item.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          itemVendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.account.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) {
        return false;
      }
      return true;
    };

    const historical = allTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      // Historical transactions are those up to the 'to' date, or current date if no 'to' date
      return transactionDate <= (toDate || new Date()) && applyFilters(t);
    });

    const future = allScheduledTransactions.filter(st => {
      const scheduledDate = new Date(st.date);
      // Future transactions are those from the 'from' date, or current date if no 'from' date
      return scheduledDate >= (fromDate || new Date()) && applyFilters(st);
    });

    // Combine historical and future for the 'combined' view within the selected range
    const combined = [...allTransactions, ...allScheduledTransactions.map(st => ({
      ...st,
      vendor: st.vendor, // ScheduledTransaction vendor is string, compatible with Transaction vendor: string | null
      is_scheduled_origin: true,
      recurrence_id: st.id, // Use scheduled_transaction id as recurrence_id
      recurrence_frequency: st.frequency,
      recurrence_end_date: st.recurrence_end_date,
      user_id: st.user_id,
      created_at: st.created_at,
      currency: selectedCurrency // Default currency, adjust if needed
    } as Transaction))]
    .filter(applyFilters)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return {
      historicalFilteredTransactions: historical,
      combinedFilteredTransactions: combined,
      futureFilteredTransactions: future,
    };
  }, [allTransactions, allScheduledTransactions, dateRange, accountFilter, categoryFilter, vendorFilter, searchTerm, selectedCurrency]);


  const reportChildrenProps: ReportChildrenProps = useMemo(() => ({
    dateRange,
    onDateChange: setDateRange,
    accountFilter,
    onAccountFilterChange: setAccountFilter,
    categoryFilter,
    onCategoryFilterChange: setCategoryFilter,
    vendorFilter,
    onVendorFilterChange: setVendorFilter,
    searchTerm,
    setSearchTerm,
    onResetFilters: handleResetFilters,
    accounts: allAccounts.map(acc => acc.name), // Names for dropdowns
    categories: allCategories.map(cat => cat.name), // Names for dropdowns
    vendors: allVendors.map(ven => ven.name), // Names for dropdowns
    historicalFilteredTransactions,
    combinedFilteredTransactions,
    futureFilteredTransactions,
    allAccounts: allAccounts, // Full account objects
    allCategories: allCategories, // Full category objects
    allVendors: allVendors, // Full vendor objects
    budgets: allBudgets,
  }), [
    dateRange, accountFilter, categoryFilter, vendorFilter, searchTerm,
    allAccounts, allCategories, allVendors, allBudgets, selectedCurrency,
    historicalFilteredTransactions, combinedFilteredTransactions, futureFilteredTransactions
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <TransactionFilters
            dateRange={reportChildrenProps.dateRange}
            onDateChange={reportChildrenProps.onDateChange}
            accountFilter={reportChildrenProps.accountFilter}
            onAccountFilterChange={reportChildrenProps.onAccountFilterChange}
            categoryFilter={reportChildrenProps.categoryFilter}
            onCategoryFilterChange={reportChildrenProps.onCategoryFilterChange}
            vendorFilter={reportChildrenProps.vendorFilter}
            onVendorFilterChange={reportChildrenProps.onVendorFilterChange}
            searchTerm={reportChildrenProps.searchTerm}
            setSearchTerm={reportChildrenProps.setSearchTerm}
            onResetFilters={reportChildrenProps.onResetFilters}
            accounts={reportChildrenProps.accounts}
            categories={reportChildrenProps.categories}
            vendors={reportChildrenProps.vendors}
          />
        </CardContent>
      </Card>
      {children(reportChildrenProps)}
    </div>
  );
}