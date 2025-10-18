"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";

const Analytics = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(
    undefined
  );
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [selectedVendor, setSelectedVendor] = useState<string | undefined>(
    undefined
  );

  const queryClient = useQueryClient();

  // Example query for analytics data (you'd replace this with actual analytics logic)
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["analytics", dateRange, selectedAccount, selectedCategory, selectedVendor],
    queryFn: async () => {
      // This is a placeholder. You would fetch actual aggregated data here.
      // For example, fetching total spending per category within the date range.
      let query = supabase.from("transactions").select("*");

      if (dateRange?.from) {
        query = query.gte("date", format(dateRange.from, "yyyy-MM-dd"));
      }
      if (dateRange?.to) {
        query = query.lte("date", format(dateRange.to, "yyyy-MM-dd"));
      }
      if (selectedAccount) {
        query = query.eq("account", selectedAccount);
      }
      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }
      if (selectedVendor) {
        query = query.eq("vendor", selectedVendor);
      }

      const { data, error } = await query;
      if (error) throw error;
      // In a real scenario, you'd process this data for analytics, e.g., sum amounts by category
      return data;
    },
  });

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("name")
        .eq("is_account", true);
      if (error) throw error;
      return data.map((account) => account.name);
    },
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("name");
      if (error) throw error;
      return data.map((category) => category.name);
    },
  });

  const { data: vendors, isLoading: isLoadingVendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("name")
        .eq("is_account", false);
      if (error) throw error;
      return data.map((vendor) => vendor.name);
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["vendors"] });
    toast.info("Analytics data refreshed.");
  };

  const handleResetFilters = () => {
    setDateRange(undefined);
    setSelectedAccount(undefined);
    setSelectedCategory(undefined);
    setSelectedVendor(undefined);
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    toast.info("Filters reset.");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Filter Analytics</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end mb-4">
          <div>
            <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <DatePickerWithRange
              id="date-range"
              date={dateRange}
              setDate={setDateRange}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="account-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Account
            </label>
            <Select
              value={selectedAccount}
              onValueChange={setSelectedAccount}
            >
              <SelectTrigger id="account-filter" className="w-full">
                <SelectValue placeholder="Filter by Account" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAccounts ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  accounts?.map((account) => (
                    <SelectItem key={account} value={account}>
                      {account}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger id="category-filter" className="w-full">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCategories ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  categories?.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="vendor-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Vendor
            </label>
            <Select
              value={selectedVendor}
              onValueChange={setSelectedVendor}
            >
              <SelectTrigger id="vendor-filter" className="w-full">
                <SelectValue placeholder="Filter by Vendor" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingVendors ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  vendors?.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" onClick={handleResetFilters} className="mt-2">
          Reset Filters
        </Button>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Analytics Overview</h3>
          {isLoadingAnalytics ? (
            <p>Loading analytics data...</p>
          ) : (
            <div className="bg-gray-50 p-4 rounded-md">
              <p>Display your analytics charts and summaries here.</p>
              <p>Total transactions: {analyticsData?.length || 0}</p>
              {/* You would add actual charts/data visualization here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;