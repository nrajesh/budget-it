import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { slugify } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { filterTransactions } from "@/utils/nlp-search";

interface Option {
  value: string;
  label: string;
}

interface UseTransactionDataProps {
  searchTerm: string;
  selectedAccounts: string[];
  selectedCategories: string[];
  selectedSubCategories: string[];
  selectedVendors: string[];
  dateRange: DateRange | undefined;
  availableAccountOptions: Option[];
  availableCategoryOptions: Option[];
  availableVendorOptions: Option[];
  excludeTransfers?: boolean;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  sortOrder?: 'largest' | 'smallest';
}

export const useTransactionData = ({
  searchTerm,
  selectedAccounts,
  selectedCategories,
  selectedSubCategories,
  selectedVendors,
  dateRange,
  availableAccountOptions,
  availableCategoryOptions,
  availableVendorOptions,
  excludeTransfers = false,
  minAmount,
  maxAmount,
  limit,
  sortOrder,
}: UseTransactionDataProps) => {
  const { transactions, scheduledTransactions } = useTransactions();

  const combinedTransactions = React.useMemo(() => {
    const projectedTransactions: any[] = [];
    const projectionHorizon = new Date();
    projectionHorizon.setFullYear(projectionHorizon.getFullYear() + 1); // 1 year projection

    scheduledTransactions.forEach(sch => {
      let nextDate = new Date(sch.date);
      while (nextDate <= projectionHorizon) {
        projectedTransactions.push({
          ...sch,
          id: `proj-${sch.id}-${nextDate.toISOString()}`, // Temporary ID
          date: nextDate.toISOString(),
          is_scheduled_origin: true,
          original_id: sch.id
        });

        // Advance date based on frequency
        const d = new Date(nextDate);
        if (sch.frequency === 'Daily') d.setDate(d.getDate() + 1);
        else if (sch.frequency === 'Weekly') d.setDate(d.getDate() + 7);
        else if (sch.frequency === 'Monthly') d.setMonth(d.getMonth() + 1);
        else if (sch.frequency === 'Yearly') d.setFullYear(d.getFullYear() + 1);
        nextDate = d;
      }
    });

    return [...transactions, ...projectedTransactions].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, scheduledTransactions]);

  const filteredTransactions = React.useMemo(() => {
    let filtered = combinedTransactions;

    if (searchTerm) {
      filtered = filterTransactions(filtered, searchTerm);
    }

    if (selectedAccounts.length > 0 && selectedAccounts.length !== availableAccountOptions.length) {
      filtered = filtered.filter((t) => selectedAccounts.includes(slugify(t.account)));
    }

    if (selectedCategories.length > 0 && selectedCategories.length !== availableCategoryOptions.length) {
      filtered = filtered.filter((t) => selectedCategories.includes(slugify(t.category)));
    }

    if (selectedSubCategories.length > 0) {
      filtered = filtered.filter((t) => {
        const subCat = t.sub_category || "uncategorized";
        const subCatSlug = slugify(subCat);
        return selectedSubCategories.includes(subCatSlug);
      });
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

    if (excludeTransfers) {
      filtered = filtered.filter((t) => {
        const isTransfer = t.category?.toLowerCase() === 'transfer';
        const isBlank = !t.category || t.category.trim() === '';
        return !isTransfer && !isBlank;
      });
    }

    if (minAmount !== undefined) {
      filtered = filtered.filter(t => Math.abs(t.amount) >= minAmount);
    }
    if (maxAmount !== undefined) {
      filtered = filtered.filter(t => Math.abs(t.amount) <= maxAmount);
    }

    // Sorting
    if (sortOrder === 'largest') {
      filtered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    } else if (sortOrder === 'smallest') {
      filtered.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    }
    // Default sort is date desc (already applied in combinedTransactions), but if filtered, order is preserved.

    // Limiting
    // IMPORTANT: sorting must happen before limiting to get the correct "top N"
    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [
    combinedTransactions,
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedSubCategories,
    selectedVendors,
    dateRange,
    availableAccountOptions.length,
    availableCategoryOptions.length,
    availableVendorOptions.length,
    excludeTransfers,
    minAmount,
    maxAmount,
    limit,
    sortOrder
  ]);

  return {
    filteredTransactions,
    combinedTransactions,
    scheduledTransactions,
  };
};
