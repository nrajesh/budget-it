"use client";

import { useState } from 'react';

export const useTransactionFilters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });

  const handleResetFilters = () => {
    setSearchTerm('');
    setDateRange({ from: undefined, to: undefined });
    setSelectedAccounts([]);
    setSelectedVendors([]);
    setSelectedCategories([]);
    setAmountRange({ min: '', max: '' });
  };

  return {
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    selectedAccounts,
    setSelectedAccounts,
    selectedVendors,
    setSelectedVendors,
    selectedCategories,
    setSelectedCategories,
    amountRange,
    setAmountRange,
    handleResetFilters,
  };
};