"use client";

import React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import slugify from "slugify";

export const useTransactionFilters = () => {
  const {
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
    accounts,
    categories: allCategories,
    vendors,
    isLoadingAccounts,
    isLoadingCategories,
    isLoadingVendors,
    handleResetFilters,
  } = useTransactions();

  const accountOptions = React.useMemo(() => accounts?.map(account => ({
    value: account.name,
    label: account.name,
  })) || [], [accounts]);

  const categoryOptions = React.useMemo(() => allCategories?.map(category => ({
    value: slugify(category.name),
    label: category.name,
  })) || [], [allCategories]);

  const vendorOptions = React.useMemo(() => vendors?.map(vendor => ({
    value: vendor.name,
    label: vendor.name,
  })) || [], [vendors]);

  return {
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
    accountOptions,
    categoryOptions,
    vendorOptions,
    isLoadingAccounts,
    isLoadingCategories,
    isLoadingVendors,
    handleResetFilters,
  };
};