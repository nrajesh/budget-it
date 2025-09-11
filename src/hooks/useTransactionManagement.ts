import * as React from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { useTransactionData } from "@/hooks/transactions/useTransactionData";
import { useTransactionPagination } from "@/hooks/transactions/useTransactionPagination";
import { useTransactionSelection } from "@/hooks/transactions/useTransactionSelection";
import { useTransactionCSV } from "@/hooks/transactions/useTransactionCSV";
import { useTransactionUI } from "@/hooks/transactions/useTransactionUI";

export const useTransactionManagement = () => {
  const { transactions: allTransactions, accountCurrencyMap } = useTransactions();
  const { formatCurrency } = useCurrency();

  // 1. Filters
  const {
    searchTerm,
    setSearchTerm,
    selectedAccounts,
    setSelectedAccounts,
    selectedCategories,
    setSelectedCategories,
    selectedVendors,
    setSelectedVendors,
    dateRange,
    setDateRange,
    availableAccountOptions,
    availableCategoryOptions,
    availableVendorOptions,
    handleResetFilters: resetFilterStates, // Rename to avoid conflict
  } = useTransactionFilters();

  // 2. Data (combines and filters transactions)
  const { filteredTransactions } = useTransactionData({
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedVendors,
    dateRange,
    availableAccountOptions,
    availableCategoryOptions,
    availableVendorOptions,
  });

  // 3. Pagination
  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    currentTransactions,
  } = useTransactionPagination(filteredTransactions);

  // 4. Selection
  const {
    selectedTransactionIds,
    isBulkDeleteConfirmOpen,
    setIsBulkDeleteConfirmOpen,
    handleSelectOne,
    handleSelectAll,
    isAllSelectedOnPage,
    handleBulkDelete,
    numSelected,
    clearSelection, // Import clearSelection
  } = useTransactionSelection(currentTransactions, allTransactions);

  // 5. CSV Operations
  const {
    isImporting,
    fileInputRef,
    handleImportClick,
    handleFileChange,
    handleExportClick,
  } = useTransactionCSV();

  // 6. UI States & Actions
  const { isRefreshing, handleRefresh } = useTransactionUI();

  // Combined reset handler
  const handleResetFilters = React.useCallback(() => {
    resetFilterStates(); // Call the filter-specific reset
    clearSelection();    // Clear transaction selections
  }, [resetFilterStates, clearSelection]);

  return {
    // States
    currentPage,
    itemsPerPage,
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedVendors,
    dateRange,
    isRefreshing,
    isImporting,
    selectedTransactionIds,
    isBulkDeleteConfirmOpen,
    fileInputRef,
    availableAccountOptions,
    availableCategoryOptions,
    availableVendorOptions,
    filteredTransactions,
    totalPages,
    startIndex,
    endIndex,
    currentTransactions,
    numSelected,
    accountCurrencyMap,
    formatCurrency,
    isAllSelectedOnPage,

    // Setters
    setCurrentPage,
    setItemsPerPage,
    setSearchTerm,
    setSelectedAccounts,
    setSelectedCategories,
    setSelectedVendors,
    setDateRange,
    setIsBulkDeleteConfirmOpen,

    // Handlers
    handleResetFilters,
    handleSelectOne,
    handleSelectAll,
    handleBulkDelete,
    handleRefresh,
    handleImportClick,
    handleFileChange,
    handleExportClick,
  };
};