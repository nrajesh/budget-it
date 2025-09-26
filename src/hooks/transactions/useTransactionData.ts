import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types";
import { slugify } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useQuery } from '@tanstack/react-query';
import { ScheduledTransaction, createScheduledTransactionsService } from '@/services/scheduledTransactionsService';
import { useCurrency } from "@/contexts/CurrencyContext";

interface Option {
  value: string;
  label: string;
}

interface UseTransactionDataProps {
  searchTerm: string;
  selectedAccounts: string[];
  selectedCategories: string[];
  selectedVendors: string[];
  dateRange: DateRange | undefined;
  availableAccountOptions: Option[];
  availableCategoryOptions: Option[];
  availableVendorOptions: Option[];
}

export const useTransactionData = ({
  searchTerm,
  selectedAccounts,
  selectedCategories,
  selectedVendors,
  dateRange,
  availableAccountOptions,
  availableCategoryOptions,
  availableVendorOptions,
}: UseTransactionDataProps) => {
  const { transactions, accountCurrencyMap, refetchTransactions: refetchMainTransactions } = useTransactions();
  const { user, isLoadingUser } = useUser();
  const { convertBetweenCurrencies } = useCurrency();

  // Fetch scheduled transactions using react-query
  const { fetchScheduledTransactions } = createScheduledTransactionsService({
    refetchTransactions: refetchMainTransactions, // Pass the actual refetch function
    userId: user?.id,
    convertBetweenCurrencies,
  });

  const { data: scheduledTransactions = [] } = useQuery<ScheduledTransaction[], Error>({
    queryKey: ['scheduledTransactions', user?.id],
    queryFn: fetchScheduledTransactions,
    enabled: !!user?.id && !isLoadingUser,
  });

  const combinedTransactions = React.useMemo(() => {
    const today = new Date();
    
    const futureMonthsToShow = parseInt(localStorage.getItem('futureMonths') || '2', 10);
    const futureDateLimit = new Date();
    futureDateLimit.setMonth(today.getMonth() + futureMonthsToShow);

    const futureTransactions = scheduledTransactions.flatMap(st => {
      const occurrences: Transaction[] = [];
      let nextDate = new Date(st.last_processed_date || st.date);

      const frequencyMatch = st.frequency.match(/^(\d+)([dwmy])$/);
      if (!frequencyMatch) return [];

      const [, numStr, unit] = frequencyMatch;
      const num = parseInt(numStr, 10);

      const advanceDate = (date: Date) => {
        const newDate = new Date(date);
        switch (unit) {
          case 'd': newDate.setDate(newDate.getDate() + num); break;
          case 'w': newDate.setDate(newDate.getDate() + num * 7); break;
          case 'm': newDate.setMonth(newDate.getMonth() + num); break;
          case 'y': newDate.setFullYear(newDate.getFullYear() + num); break;
        }
        return newDate;
      };

      // Advance nextDate past today if it's still in the past
      while (nextDate <= today) {
        nextDate = advanceDate(nextDate);
      }

      const recurrenceEndDate = st.recurrence_end_date ? new Date(st.recurrence_end_date) : null;
      if (recurrenceEndDate) recurrenceEndDate.setHours(23, 59, 59, 999); // Normalize to end of day

      while (nextDate < futureDateLimit) {
        if (recurrenceEndDate && nextDate > recurrenceEndDate) {
          break; // Stop if we've passed the recurrence end date
        }

        occurrences.push({
          id: `scheduled-${st.id}-${nextDate.toISOString()}`,
          date: nextDate.toISOString(),
          account: st.account,
          vendor: st.vendor,
          category: st.category,
          amount: st.amount,
          remarks: st.remarks || null,
          currency: accountCurrencyMap.get(st.account) || 'USD',
          user_id: st.user_id,
          created_at: st.created_at,
          is_scheduled_origin: true,
          recurrence_id: st.id, // Link to the scheduled transaction ID
          transfer_id: null,
          recurrence_frequency: st.frequency, // Add recurrence_frequency
          recurrence_end_date: st.recurrence_end_date || null, // Add recurrence_end_date
        });
        nextDate = advanceDate(nextDate);
      }

      return occurrences;
    });

    return [...transactions, ...futureTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, scheduledTransactions, accountCurrencyMap]); // Removed refetchMainTransactions

  const filteredTransactions = React.useMemo(() => {
    // console.log("--- Filtering Transactions (useMemo re-run) ---");
    // console.log("Initial Combined Transactions Count:", combinedTransactions.length);
    // console.log("Search Term:", searchTerm);
    // console.log("Selected Accounts:", selectedAccounts);
    // console.log("Available Account Options Length:", availableAccountOptions.length);
    // console.log("Selected Categories:", selectedCategories);
    // console.log("Available Category Options Length:", availableCategoryOptions.length);
    // console.log("Selected Vendors:", selectedVendors);
    // console.log("Available Vendor Options Length:", availableVendorOptions.length);
    // console.log("Date Range:", dateRange);

    let filtered = combinedTransactions;

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.vendor && t.vendor.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (t.remarks && t.remarks.toLowerCase().includes(lowerCaseSearchTerm))
      );
      // console.log("After Search Term Filter:", filtered.length, "transactions");
    }

    // Account filtering
    // Only filter if specific accounts are selected (i.e., not all accounts are selected)
    if (selectedAccounts.length > 0 && selectedAccounts.length !== availableAccountOptions.length) {
      filtered = filtered.filter((t) => selectedAccounts.includes(slugify(t.account)));
      // console.log("After Account Filter:", filtered.length, "transactions");
    }

    // Category filtering
    // Only filter if specific categories are selected (i.e., not all categories are selected)
    if (selectedCategories.length > 0 && selectedCategories.length !== availableCategoryOptions.length) {
      filtered = filtered.filter((t) => selectedCategories.includes(slugify(t.category)));
      // console.log("After Category Filter:", filtered.length, "transactions");
    }

    // Vendor filtering
    // Only filter if specific vendors are selected (i.e., not all vendors are selected)
    if (selectedVendors.length > 0 && selectedVendors.length !== availableVendorOptions.length) {
      filtered = filtered.filter((t) => t.vendor && selectedVendors.includes(slugify(t.vendor)));
      // console.log("After Vendor Filter:", filtered.length, "transactions");
    }

    // Date range filtering
    if (dateRange?.from) {
      const fromDate = dateRange.from;
      const toDate = dateRange.to || new Date();
      toDate.setHours(23, 59, 59, 999); // Normalize to end of day to include transactions on the 'to' date
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= fromDate && transactionDate <= toDate;
      });
      // console.log("After Date Range Filter:", filtered.length, "transactions");
    }

    // console.log("Final Filtered Transactions Count:", filtered.length);
    return filtered;
  }, [
    combinedTransactions,
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedVendors,
    dateRange,
    availableAccountOptions.length,
    availableCategoryOptions.length,
    availableVendorOptions.length,
  ]);

  return {
    filteredTransactions,
    combinedTransactions,
  };
};