import React from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { endOfMonth, startOfMonth } from "date-fns";
import { useDefaultAccountSelection } from '@/hooks/useDefaultAccountSelection';

export const useTransactionFilters = () => {
  const {
    searchTerm, setSearchTerm,
    selectedAccounts, setSelectedAccounts,
    selectedCategories, setSelectedCategories,
    selectedSubCategories, setSelectedSubCategories,
    selectedVendors, setSelectedVendors,
    dateRange, setDateRange,
    excludeTransfers, setExcludeTransfers,
    minAmount, setMinAmount,
    maxAmount, setMaxAmount,
    limit, setLimit,
    sortOrder, setSortOrder,
    rawSearchQuery, setRawSearchQuery
  } = useFilter();

  const { selectDefaultAccounts } = useDefaultAccountSelection({ autoRun: false });

  const handleResetFilters = React.useCallback(() => {
    setSearchTerm("");
    setRawSearchQuery(""); // Clear persisted raw query
    // We don't just clear accounts, we reset to "smart defaults"
    setSelectedAccounts([]);

    // Explicitly call the default selection logic
    selectDefaultAccounts();

    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setSelectedVendors([]);
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
    setExcludeTransfers(false);
    setMinAmount(undefined);
    setMaxAmount(undefined);
    setLimit(undefined);
    setSortOrder(undefined);
  }, [setSearchTerm, setRawSearchQuery, setSelectedAccounts, selectDefaultAccounts, setSelectedCategories, setSelectedSubCategories, setSelectedVendors, setDateRange, setExcludeTransfers, setMinAmount, setMaxAmount, setLimit, setSortOrder]);

  return {
    searchTerm,
    setSearchTerm,
    selectedAccounts,
    setSelectedAccounts,
    selectedCategories,
    setSelectedCategories,
    selectedSubCategories,
    setSelectedSubCategories,
    selectedVendors,
    setSelectedVendors,
    dateRange,
    setDateRange,
    excludeTransfers,
    setExcludeTransfers,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    limit,
    setLimit,
    sortOrder,
    setSortOrder,
    rawSearchQuery,
    setRawSearchQuery,
    handleResetFilters,
  };
};
