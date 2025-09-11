import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { slugify } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { useQuery } from '@tanstack/react-query'; // Import useQuery

interface Option {
  value: string;
  label: string;
}

// Helper function to fetch vendor names (accounts or regular vendors)
const fetchVendorNames = async (isAccount: boolean, userId: string | undefined): Promise<Option[]> => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('vendors')
    .select('name')
    .eq('is_account', isAccount);

  if (error) {
    console.error(`Error fetching ${isAccount ? 'account' : 'vendor'} names:`, error.message);
    throw error;
  }
  return data.map(item => ({
    value: slugify(item.name),
    label: item.name,
  }));
};

export const useTransactionFilters = () => {
  const { categories: allCategories } = useTransactions();
  const { user, isLoadingUser } = useUser();
  const location = useLocation();

  // Filter states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  // Fetch available account options using react-query
  const { data: availableAccountOptions = [] } = useQuery<Option[], Error>({
    queryKey: ['availableAccountOptions', user?.id],
    queryFn: () => fetchVendorNames(true, user?.id),
    enabled: !!user?.id && !isLoadingUser,
  });

  // Fetch available vendor options using react-query
  const { data: availableVendorOptions = [] } = useQuery<Option[], Error>({
    queryKey: ['availableVendorOptions', user?.id],
    queryFn: () => fetchVendorNames(false, user?.id),
    enabled: !!user?.id && !isLoadingUser,
  });

  const availableCategoryOptions = React.useMemo(() => {
    return allCategories.map(category => ({
      value: slugify(category.name),
      label: category.name,
    }));
  }, [allCategories]);

  // Clear selections on user logout
  React.useEffect(() => {
    if (!user?.id) {
      setSelectedAccounts([]);
      setSelectedCategories([]);
      setSelectedVendors([]);
    }
  }, [user?.id]);

  // Handle filters from navigation state
  React.useEffect(() => {
    if (location.state) {
      if (location.state.filterVendor) {
        const vendorOption = availableVendorOptions.find(opt => opt.label === location.state.filterVendor);
        if (vendorOption) {
          setSelectedVendors([vendorOption.value]);
        }
      }
      if (location.state.filterCategory) {
        const categoryOption = availableCategoryOptions.find(opt => opt.label === location.state.filterCategory);
        if (categoryOption) {
          setSelectedCategories([categoryOption.value]);
        }
      }
      // Clear location state after applying filters to prevent re-applying on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, availableVendorOptions, availableCategoryOptions]);


  const handleResetFilters = React.useCallback(() => {
    // console.log("Resetting filters...");
    setSearchTerm("");
    // Re-select all available options
    setSelectedAccounts(availableAccountOptions.map(acc => acc.value));
    setSelectedCategories(availableCategoryOptions.map(cat => cat.value));
    setSelectedVendors(availableVendorOptions.map(v => v.value));
    setDateRange(undefined);
  }, [availableAccountOptions, availableCategoryOptions, availableVendorOptions]);

  // Add console logs to track state changes
  // React.useEffect(() => {
  //   console.log("Filter State - Search Term:", searchTerm);
  // }, [searchTerm]);

  // React.useEffect(() => {
  //   console.log("Filter State - Selected Accounts:", selectedAccounts);
  // }, [selectedAccounts]);

  // React.useEffect(() => {
  //   console.log("Filter State - Selected Categories:", selectedCategories);
  // }, [selectedCategories]);

  // React.useEffect(() => {
  //   console.log("Filter State - Selected Vendors:", selectedVendors);
  // }, [selectedVendors]);

  // React.useEffect(() => {
  //   console.log("Filter State - Date Range:", dateRange);
  // }, [dateRange]);


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
    availableAccountOptions,
    availableCategoryOptions,
    availableVendorOptions,
    handleResetFilters,
  };
};