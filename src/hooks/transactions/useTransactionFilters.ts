import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { slugify } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

interface Option {
  value: string;
  label: string;
}

export const useTransactionFilters = () => {
  const { categories: allCategories } = useTransactions();
  const { user } = useUser();
  const location = useLocation();

  // Filter states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  // State for dynamically fetched options
  const [availableAccountOptions, setAvailableAccountOptions] = React.useState<Option[]>([]);
  const [availableVendorOptions, setAvailableVendorOptions] = React.useState<Option[]>([]);

  // Fetch available accounts dynamically
  const fetchAvailableAccounts = React.useCallback(async () => {
    if (!user?.id) {
      setAvailableAccountOptions([]);
      return;
    }
    const { data, error } = await supabase
      .from('vendors')
      .select('name')
      .eq('is_account', true);

    if (error) {
      console.error("Error fetching account names:", error.message);
      setAvailableAccountOptions([]);
    } else {
      const newOptions = data.map(item => ({
        value: slugify(item.name),
        label: item.name,
      }));
      // Only update state if options have actually changed to prevent unnecessary re-renders
      setAvailableAccountOptions(prevOptions => {
        if (prevOptions.length === newOptions.length &&
            prevOptions.every((opt, i) => opt.value === newOptions[i].value && opt.label === newOptions[i].label)) {
          return prevOptions; // No change, return existing reference
        }
        return newOptions;
      });
    }
  }, [user?.id]);

  // Fetch available vendors dynamically
  const fetchAvailableVendors = React.useCallback(async () => {
    if (!user?.id) {
      setAvailableVendorOptions([]);
      return;
    }
    const { data, error } = await supabase
      .from('vendors')
      .select('name')
      .eq('is_account', false);

    if (error) {
      console.error("Error fetching vendor names:", error.message);
      setAvailableVendorOptions([]);
    } else {
      const newOptions = data.map(item => ({
        value: slugify(item.name),
        label: item.name,
      }));
      // Only update state if options have actually changed to prevent unnecessary re-renders
      setAvailableVendorOptions(prevOptions => {
        if (prevOptions.length === newOptions.length &&
            prevOptions.every((opt, i) => opt.value === newOptions[i].value && opt.label === newOptions[i].label)) {
          return prevOptions; // No change, return existing reference
        }
        return newOptions;
      });
    }
  }, [user?.id]);

  React.useEffect(() => {
    fetchAvailableAccounts();
    fetchAvailableVendors();
  }, [fetchAvailableAccounts, fetchAvailableVendors]);

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
    console.log("Resetting filters...");
    setSearchTerm("");
    // Re-select all available options
    setSelectedAccounts(availableAccountOptions.map(acc => acc.value));
    setSelectedCategories(availableCategoryOptions.map(cat => cat.value));
    setSelectedVendors(availableVendorOptions.map(v => v.value));
    setDateRange(undefined);
    // Note: Clearing selectedTransactionIds will be handled in useTransactionManagement's handleResetFilters
  }, [availableAccountOptions, availableCategoryOptions, availableVendorOptions]);

  // Add console logs to track state changes
  React.useEffect(() => {
    console.log("Filter State - Search Term:", searchTerm);
  }, [searchTerm]);

  React.useEffect(() => {
    console.log("Filter State - Selected Accounts:", selectedAccounts);
  }, [selectedAccounts]);

  React.useEffect(() => {
    console.log("Filter State - Selected Categories:", selectedCategories);
  }, [selectedCategories]);

  React.useEffect(() => {
    console.log("Filter State - Selected Vendors:", selectedVendors);
  }, [selectedVendors]);

  React.useEffect(() => {
    console.log("Filter State - Date Range:", dateRange);
  }, [dateRange]);


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