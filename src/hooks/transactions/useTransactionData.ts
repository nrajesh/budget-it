import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/data/finance-data";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters"; // Updated import path
import { slugify } from "@/lib/utils";

type ScheduledTransaction = {
  id: string;
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  frequency: string;
  remarks?: string;
  user_id: string;
  created_at: string;
  last_processed_date?: string;
};

export const useTransactionData = () => {
  const { transactions, accountCurrencyMap } = useTransactions();
  const { user } = useUser();
  const {
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedVendors,
    dateRange,
    availableAccountOptions,
    availableCategoryOptions,
    availableVendorOptions,
  } = useTransactionFilters();

  const [scheduledTransactions, setScheduledTransactions] = React.useState<ScheduledTransaction[]>([]);

  // Fetch scheduled transactions
  React.useEffect(() => {
    const fetchScheduled = async () => {
      if (!user) return;
      const { data } = await supabase.from('scheduled_transactions').select('*').eq('user_id', user.id);
      setScheduledTransactions(data || []);
    };
    fetchScheduled();
  }, [user]);

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

      while (nextDate <= today) {
        nextDate = advanceDate(nextDate);
      }

      while (nextDate < futureDateLimit) {
        occurrences.push({
          id: `scheduled-${st.id}-${nextDate.toISOString()}`,
          date: nextDate.toISOString(),
          account: st.account,
          vendor: st.vendor,
          category: st.category,
          amount: st.amount,
          remarks: st.remarks,
          currency: accountCurrencyMap.get(st.account) || 'USD',
          user_id: st.user_id,
          created_at: st.created_at,
          is_scheduled_origin: true,
        });
        nextDate = advanceDate(nextDate);
      }

      return occurrences;
    });

    return [...transactions, ...futureTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, scheduledTransactions, accountCurrencyMap]);

  const filteredTransactions = React.useMemo(() => {
    let filtered = combinedTransactions;

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.vendor.toLowerCase().includes(lowerCaseSearchTerm) ||
          (t.remarks && t.remarks.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    if (selectedAccounts.length > 0 && selectedAccounts.length !== availableAccountOptions.length) {
      filtered = filtered.filter((t) => selectedAccounts.includes(slugify(t.account)));
    }

    if (selectedCategories.length > 0 && selectedCategories.length !== availableCategoryOptions.length) {
      filtered = filtered.filter((t) => selectedCategories.includes(slugify(t.category)));
    }

    if (selectedVendors.length > 0 && selectedVendors.length !== availableVendorOptions.length) {
      filtered = filtered.filter((t) => selectedVendors.includes(slugify(t.vendor)));
    }

    if (dateRange?.from) {
      const fromDate = dateRange.from;
      const toDate = dateRange.to || new Date();
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= fromDate && transactionDate <= toDate;
      });
    }

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