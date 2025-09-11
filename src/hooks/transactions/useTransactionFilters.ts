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
      const options = data.map(item => ({
        value: slugify(item.name),
        label: item.name,
      }));
      setAvailableAccountOptions(options);
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
      const options = data.map(item => ({
        value: slugify(item.name),
        label: item.name,
      }));
      setAvailableVendorOptions(options);
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

  // Initialize selected filters to "all" by default
  React.useEffect(() => {
    if (availableAccountOptions.length > 0) {
      setSelectedAccounts(availableAccountOptions.map(acc => acc.value));
    }
  }, [availableAccountOptions]);

  React.useEffect(() => {
    if (availableCategoryOptions.length > 0) {
      setSelectedCategories(availableCategoryOptions.map(cat => cat.value));
    }
  }, [availableCategoryOptions]);

  React.useEffect(() => {
    if (availableVendorOptions.length > 0) {
      setSelectedVendors(availableVendorOptions.map(v => v.value));
    }
  }, [availableVendorOptions]);

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
    setSearchTerm("");
    setSelectedAccounts(availableAccountOptions.map(acc => acc.value));
    setSelectedCategories(availableCategoryOptions.map(cat => cat.value));
    setSelectedVendors(availableVendorOptions.map(v => v.value));
    setDateRange(undefined);
  }, [availableAccountOptions, availableCategoryOptions, availableVendorOptions]);

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