import { useFilter } from '@/contexts/FilterContext';
import { endOfMonth, startOfMonth } from "date-fns";

export const useTransactionFilters = () => {
  const {
    searchTerm, setSearchTerm,
    selectedAccounts, setSelectedAccounts,
    selectedCategories, setSelectedCategories,
    selectedSubCategories, setSelectedSubCategories,
    selectedVendors, setSelectedVendors,
    dateRange, setDateRange,
    excludeTransfers, setExcludeTransfers
  } = useFilter();

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedAccounts([]);
    setSelectedCategories([]);
    setSelectedSubCategories([]);
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
    selectedSubCategories,
    setSelectedSubCategories,
    selectedVendors,
    setSelectedVendors,
    dateRange,
    setDateRange,
    excludeTransfers,
    setExcludeTransfers,
    handleResetFilters,
  };
};
