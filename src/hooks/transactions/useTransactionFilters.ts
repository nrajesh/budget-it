"use client";

import { useState, useMemo } from 'react';

export const useTransactionFilters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });

  const filters = {
    searchTerm,
    dateRange,
    selectedAccounts,
    selectedVendors,
    selectedCategories,
    amountRange,
  };

  const setFilters = {
    setSearchTerm,
    setDateRange,
    setSelectedAccounts,
    setSelectedVendors,
    setSelectedCategories,
    setAmountRange,
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange({ from: undefined, to: undefined });
    setSelectedAccounts([]);
    setSelectedVendors([]);
    setSelectedCategories([]);
    setAmountRange({ min: '', max: '' });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (dateRange.from || dateRange.to) count++;
    if (selectedAccounts.length > 0) count++;
    if (selectedVendors.length > 0) count++;
    if (selectedCategories.length > 0) count++;
    if (amountRange.min || amountRange.max) count++;
    return count;
  }, [filters]);

  return {
    filters,
    setFilters,
    clearFilters,
    activeFilterCount,
  };
};