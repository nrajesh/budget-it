"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Account, type Category, type Vendor } from "@/pages/Transactions"; // Import types from Transactions page

interface ReportLayoutProps {
  children: React.ReactNode;
}

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

export default function ReportLayout({ children }: ReportLayoutProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [vendorFilter, setVendorFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

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

  const handleResetFilters = () => {
    setDateRange(undefined);
    setAccountFilter("");
    setCategoryFilter("");
    setVendorFilter("");
    setSearchTerm("");
  };

  const filterProps = useMemo(() => ({
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
    accounts: accounts.map(acc => acc.name),
    categories: categories.map(cat => cat.name),
    vendors: vendors.map(ven => ven.name),
  }), [dateRange, accountFilter, categoryFilter, vendorFilter, searchTerm, accounts, categories, vendors]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Reports</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionFilters {...filterProps} />
        </CardContent>
      </Card>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { filters: filterProps });
        }
        return child;
      })}
    </div>
  );
}