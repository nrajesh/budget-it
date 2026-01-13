import { useState, useMemo } from 'react';
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth } from "date-fns";

export const useTransactionFilters = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [excludeTransfers, setExcludeTransfers] = useState(false);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedAccounts([]);
    setSelectedCategories([]);
    setSelectedVendors([]);
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
    setExcludeTransfers(false);
  };

  return {
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
    excludeTransfers,
    setExcludeTransfers,
    handleResetFilters,
  };
};
