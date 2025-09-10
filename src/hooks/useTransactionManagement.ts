import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { DateRange } from "react-day-picker";
import { slugify, formatDateToDDMMYYYY, parseDateFromDDMMYYYY } from "@/lib/utils";
import { Transaction } from "@/data/finance-data";
import { supabase } from "@/integrations/supabase/client";
import { ensurePayeeExists, ensureCategoryExists } from "@/integrations/supabase/utils"; // Import ensureCategoryExists
import { showError, showSuccess } from "@/utils/toast";
import Papa from "papaparse";
import { useUser } from "@/contexts/UserContext"; // Import useUser
import { useLocation } from "react-router-dom"; // Import useLocation

interface TransactionToDelete {
  id: string;
  transfer_id?: string;
}

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

export const useTransactionManagement = () => {
  const {
    transactions,
    deleteMultipleTransactions,
    accountCurrencyMap,
    fetchTransactions,
    refetchAllPayees,
    categories: allCategories, // Get categories from context
  } = useTransactions();
  const { user } = useUser(); // Get user from UserContext
  const { formatCurrency } = useCurrency();
  const location = useLocation(); // Get location to access state

  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Filter states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>([]); // New state for vendor filter
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  // UI states
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = React.useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // State for dynamically fetched account options
  const [availableAccountOptions, setAvailableAccountOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [availableVendorOptions, setAvailableVendorOptions] = React.useState<{ value: string; label: string }[]>([]); // New state for vendor options
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

  // Fetch available accounts dynamically
  const fetchAvailableAccounts = React.useCallback(async () => {
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
  }, []);

  // Fetch available vendors dynamically
  const fetchAvailableVendors = React.useCallback(async () => {
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
  }, []);

  React.useEffect(() => {
    fetchAvailableAccounts();
    fetchAvailableVendors(); // Fetch vendors as well
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
      setSelectedVendors(availableVendorOptions.map(v => v.value)); // Initialize vendor filter to "all"
    }
  }, [availableVendorOptions]);

  // Handle filters from navigation state
  React.useEffect(() => {
    if (location.state) {
      if (location.state.filterVendor) {
        // Find the vendor in availableVendorOptions and set as selected
        const vendorOption = availableVendorOptions.find(opt => opt.label === location.state.filterVendor);
        if (vendorOption) {
          setSelectedVendors([vendorOption.value]); // Set only the specific vendor
        }
      }
      if (location.state.filterCategory) {
        // Find the category in availableCategoryOptions and set as selected
        const categoryOption = availableCategoryOptions.find(opt => opt.label === location.state.filterCategory);
        if (categoryOption) {
          setSelectedCategories([categoryOption.value]); // Set only the specific category
        }
      }
    }
  }, [location.state, availableVendorOptions, availableCategoryOptions]);

  const combinedTransactions = React.useMemo(() => {
    const today = new Date();
    
    // Read the setting from localStorage, default to 2 months
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

      // Move to the first occurrence that is after today
      while (nextDate <= today) {
        nextDate = advanceDate(nextDate);
      }

      // Add occurrences up to the future date limit
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
          isScheduled: true,
        });
        nextDate = advanceDate(nextDate);
      }

      return occurrences;
    });

    return [...transactions, ...futureTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, scheduledTransactions, accountCurrencyMap]);

  const filteredTransactions = React.useMemo(() => {
    let filtered = combinedTransactions;

    // Filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.vendor.toLowerCase().includes(lowerCaseSearchTerm) ||
          (t.remarks && t.remarks.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    // Filter by selected accounts
    if (selectedAccounts.length > 0 && selectedAccounts.length !== availableAccountOptions.length) {
      filtered = filtered.filter((t) => selectedAccounts.includes(slugify(t.account)));
    }

    // Filter by selected categories
    if (selectedCategories.length > 0 && selectedCategories.length !== availableCategoryOptions.length) {
      filtered = filtered.filter((t) => selectedCategories.includes(slugify(t.category)));
    }

    // Filter by selected vendors
    if (selectedVendors.length > 0 && selectedVendors.length !== availableVendorOptions.length) {
      filtered = filtered.filter((t) => selectedVendors.includes(slugify(t.vendor)));
    }

    // Filter by date range
    if (dateRange?.from) {
      const fromDate = dateRange.from;
      const toDate = dateRange.to || new Date(); // If 'to' is not set, assume today
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= fromDate && transactionDate <= toDate;
      });
    }

    return filtered;
  }, [combinedTransactions, searchTerm, selectedAccounts, selectedCategories, selectedVendors, dateRange, availableAccountOptions.length, availableCategoryOptions.length, availableVendorOptions.length]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedAccounts(availableAccountOptions.map(acc => acc.value));
    setSelectedCategories(availableCategoryOptions.map(cat => cat.value));
    setSelectedVendors(availableVendorOptions.map(v => v.value)); // Reset vendor filter
    setDateRange(undefined);
  };

  // Multi-select handlers
  const handleSelectOne = (id: string) => {
    setSelectedTransactionIds((prev) =>
      prev.includes(id) ? prev.filter((_id) => _id !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactionIds(currentTransactions.filter(t => !t.isScheduled).map((t) => t.id));
    } else {
      setSelectedTransactionIds([]);
    }
  };

  const isAllSelectedOnPage =
    currentTransactions.filter(t => !t.isScheduled).length > 0 &&
    currentTransactions.filter(t => !t.isScheduled).every((t) => selectedTransactionIds.includes(t.id));

  const handleBulkDelete = () => {
    const transactionsToDelete = selectedTransactionIds.map(id => {
      const transaction = transactions.find(t => t.id === id);
      return { id, transfer_id: transaction?.transfer_id };
    });
    deleteMultipleTransactions(transactionsToDelete);
    setSelectedTransactionIds([]);
    setIsBulkDeleteConfirmOpen(false);
  };

  // Reset pagination and selection when filters or itemsPerPage change
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedTransactionIds([]);
  }, [filteredTransactions, itemsPerPage]);

  const numSelected = selectedTransactionIds.length;
  const rowCount = currentTransactions.length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions();
    setIsRefreshing(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!user) {
      showError("You must be logged in to import transactions.");
      setIsImporting(false);
      return;
    }

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      complete: async (results) => {
        const requiredHeaders = ["Date", "Account", "Vendor", "Category", "Amount", "Remarks", "Currency"];
        const actualHeaders = results.meta.fields || [];
        const hasAllHeaders = requiredHeaders.every(h => actualHeaders.includes(h));

        if (!hasAllHeaders) {
          showError(`CSV is missing required headers: ${requiredHeaders.join(", ")}. Please ensure all columns are present.`);
          setIsImporting(false);
          return;
        }

        const parsedData = results.data as any[];
        if (parsedData.length === 0) {
          showError("No data found in CSV.");
          setIsImporting(false);
          return;
        }

        try {
          // Step 1: Ensure all payees exist
          const uniqueAccountsData = parsedData.map(row => ({
            name: row.Account,
            currency: row.Currency,
          })).filter(item => item.name);

          await Promise.all(uniqueAccountsData.map(async (acc) => {
            await ensurePayeeExists(acc.name, true, { currency: acc.currency, startingBalance: 0 });
          }));

          const uniqueVendors = [...new Set(parsedData.map(row => row.Vendor).filter(Boolean))];
          await Promise.all(uniqueVendors.map(name => {
            const row = parsedData.find(r => r.Vendor === name);
            const isTransfer = row?.Category === 'Transfer';
            return ensurePayeeExists(name, isTransfer);
          }));

          // Step 2: Ensure all categories exist
          const uniqueCategories = [...new Set(parsedData.map(row => row.Category).filter(Boolean))];
          await Promise.all(uniqueCategories.map(name => ensureCategoryExists(name, user.id)));

          await refetchAllPayees(); // Refresh all payees (including accounts) and categories to ensure maps are up-to-date

          // Step 3: Prepare transactions for insertion using the now-updated accountCurrencyMap
          const transactionsToInsert = parsedData.map(row => {
            const accountCurrency = accountCurrencyMap.get(row.Account) || row.Currency || 'USD';
            if (!accountCurrency) {
              console.warn(`Could not determine currency for account: ${row.Account}. Skipping row.`);
              return null;
            }
            return {
              date: parseDateFromDDMMYYYY(row.Date).toISOString(),
              account: row.Account,
              vendor: row.Vendor,
              category: row.Category,
              amount: parseFloat(row.Amount) || 0,
              remarks: row.Remarks,
              currency: accountCurrency,
              transfer_id: row.transfer_id || null,
            };
          }).filter((t): t is NonNullable<typeof t> => t !== null);

          if (transactionsToInsert.length === 0) {
            showError("No valid transactions could be prepared from the CSV. Check account names, amounts, and currency column.");
            setIsImporting(false);
            return;
          }

          // Step 4: Insert transactions
          const { error } = await supabase.from('transactions').insert(transactionsToInsert);
          if (error) throw error;

          showSuccess(`${transactionsToInsert.length} transactions imported successfully!`);
          fetchTransactions();
        } catch (error: any) {
          showError(`Import failed: ${error.message}`);
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      },
      error: (error: any) => {
        showError(`CSV parsing error: ${error.message}`);
        setIsImporting(false);
      },
    });
  };

  const handleExportClick = () => {
    if (transactions.length === 0) {
      showError("No transactions to export.");
      return;
    }

    const dataToExport = transactions.map(t => ({
      "Date": formatDateToDDMMYYYY(t.date),
      "Account": t.account,
      "Vendor": t.vendor,
      "Category": t.category,
      "Amount": t.amount,
      "Remarks": t.remarks,
      "Currency": t.currency,
      "transfer_id": t.transfer_id || null,
    }));

    const csv = Papa.unparse(dataToExport, {
      delimiter: ';',
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "transactions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    // States
    currentPage,
    itemsPerPage,
    searchTerm,
    selectedAccounts,
    selectedCategories,
    selectedVendors, // Add selectedVendors to the returned object
    dateRange,
    isRefreshing,
    isImporting,
    selectedTransactionIds,
    isBulkDeleteConfirmOpen,
    fileInputRef,
    availableAccountOptions,
    availableCategoryOptions,
    availableVendorOptions, // Add availableVendorOptions to the returned object
    filteredTransactions,
    totalPages,
    startIndex,
    endIndex,
    currentTransactions,
    numSelected,
    rowCount: currentTransactions.length, // Use currentTransactions.length for rowCount
    accountCurrencyMap,
    formatCurrency,
    isAllSelectedOnPage,

    // Setters
    setCurrentPage,
    setItemsPerPage,
    setSearchTerm,
    setSelectedAccounts,
    setSelectedCategories,
    setSelectedVendors, // Add setSelectedVendors to the returned object
    setDateRange,
    setIsBulkDeleteConfirmOpen,

    // Handlers
    handleResetFilters,
    handleSelectOne,
    handleSelectAll,
    handleBulkDelete,
    handleRefresh,
    handleImportClick,
    handleFileChange,
    handleExportClick,
    fetchTransactions,
    refetchAllPayees,
  };
};