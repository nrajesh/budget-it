import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/data/finance-data";
import { slugify } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useQuery } from '@tanstack/react-query';
import { ScheduledTransaction, createScheduledTransactionsService, generateFutureTransactions } from '@/services/scheduledTransactionsService';

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

  // Fetch scheduled transactions using react-query
  const { fetchScheduledTransactions } = createScheduledTransactionsService({
    refetchTransactions: refetchMainTransactions,
    userId: user?.id,
  });

  const { data: scheduledTransactions = [] } = useQuery<ScheduledTransaction[], Error>({
    queryKey: ['scheduledTransactions', user?.id],
    queryFn: fetchScheduledTransactions,
    enabled: !!user?.id && !isLoadingUser,
  });

  const combinedTransactions = React.useMemo(() => {
    const futureTransactions = generateFutureTransactions(scheduledTransactions, accountCurrencyMap);
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
      toDate.setHours(23, 59, 59, 999);
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