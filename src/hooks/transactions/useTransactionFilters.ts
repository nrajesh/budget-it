import { useFilter } from '@/contexts/FilterContext';
import { endOfMonth } from "date-fns";

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
      from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
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
