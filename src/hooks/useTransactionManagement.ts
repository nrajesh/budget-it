"use client";

import { useMemo } from "react";
import { useTransactionFilters } from "./transactions/useTransactionFilters";
import { useTransactionSorting } from "./transactions/useTransactionSorting";
import { useTransactionPagination } from "./transactions/useTransactionPagination";
import { useTransactionData } from "./transactions/useTransactionData";
import { useTransactionSelection } from "./transactions/useTransactionSelection";

export const useTransactionManagement = () => {
  const {
    combinedTransactions: allTransactions,
    isLoading,
    error,
    accounts,
    vendors,
    categories,
    accountCurrencyMap,
  } = useTransactionData();

  const { filters, setFilters, clearFilters, activeFilterCount } = useTransactionFilters();
  const { sorting, setSorting } = useTransactionSorting();

  const filteredTransactions = useMemo(() => {
    // Placeholder for filtering logic
    return allTransactions;
  }, [allTransactions, filters]);

  const sortedTransactions = useMemo(() => {
    // Placeholder for sorting logic
    return filteredTransactions;
  }, [filteredTransactions, sorting]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageCount,
    paginatedTransactions: currentTransactions,
  } = useTransactionPagination(sortedTransactions);

  const {
    selectedTransactionIds,
    isBulkDeleteConfirmOpen,
    setIsBulkDeleteConfirmOpen,
    handleSelectOne,
    handleSelectAll,
    isAllSelectedOnPage,
    handleBulkDelete,
    numSelected,
    clearSelection,
  } = useTransactionSelection(currentTransactions);

  return {
    allTransactions,
    currentTransactions,
    isLoading,
    error,
    accounts,
    vendors,
    categories,
    accountCurrencyMap,
    // Filters
    filters,
    setFilters,
    clearFilters,
    activeFilterCount,
    // Sorting
    sorting,
    setSorting,
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageCount,
    // Selection
    selectedTransactionIds,
    isBulkDeleteConfirmOpen,
    setIsBulkDeleteConfirmOpen,
    handleSelectOne,
    handleSelectAll,
    isAllSelectedOnPage,
    handleBulkDelete,
    numSelected,
    clearSelection,
  };
};