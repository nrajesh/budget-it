import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { DateRange } from "react-day-picker";
import { slugify, formatDateToDDMMYYYY, parseDateFromDDMMYYYY } from "@/lib/utils";
import { Transaction, categories as allDefinedCategories } from "@/data/finance-data";
import { supabase } from "@/integrations/supabase/client";
import { ensurePayeeExists } from "@/integrations/supabase/utils";
import { showError, showSuccess } from "@/utils/toast";
import Papa from "papaparse";

interface TransactionToDelete {
  id: string;
  transfer_id?: string;
}

export const useTransactionManagement = () => {
  const {
    transactions,
    deleteMultipleTransactions,
    accountCurrencyMap,
    fetchTransactions,
    refetchAllPayees,
  } = useTransactions();
  const { formatCurrency } = useCurrency();

  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Filter states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  // UI states
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = React.useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // State for dynamically fetched account options
  const [availableAccountOptions, setAvailableAccountOptions] = React.useState<{ value: string; label: string }[]>([]);

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

  React.useEffect(() => {
    fetchAvailableAccounts();
  }, [fetchAvailableAccounts]);

  const availableCategoryOptions = React.useMemo(() => {
    return allDefinedCategories.map(category => ({
      value: slugify(category),
      label: category,
    }));
  }, []);

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

  const filteredTransactions = React.useMemo(() => {
    let filtered = transactions;

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
  }, [transactions, searchTerm, selectedAccounts, selectedCategories, dateRange, availableAccountOptions.length, availableCategoryOptions.length]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedAccounts(availableAccountOptions.map(acc => acc.value));
    setSelectedCategories(availableCategoryOptions.map(cat => cat.value));
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
      setSelectedTransactionIds(currentTransactions.map((t) => t.id));
    } else {
      setSelectedTransactionIds([]);
    }
  };

  const isAllSelectedOnPage =
    currentTransactions.length > 0 &&
    currentTransactions.every((t) => selectedTransactionIds.includes(t.id));

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

          await refetchAllPayees(); // Refresh all payees (including accounts) to ensure accountCurrencyMap is up-to-date

          // Step 2: Prepare transactions for insertion using the now-updated accountCurrencyMap
          const transactionsToInsert = parsedData.map(row => {
            const accountCurrency = accountCurrencyMap.get(row.Account) || row.Currency || 'USD';
            if (!accountCurrency) {
              console.warn(`Could not determine currency for account: ${row.Account}. Skipping row.`);
              return null;
            }
            return {
              date: parseDateFromDDMMYYYY(row.Date).toISOString(), // Parse date from DD-MMM-YYYY
              account: row.Account,
              vendor: row.Vendor,
              category: row.Category,
              amount: parseFloat(row.Amount) || 0,
              remarks: row.Remarks,
              currency: accountCurrency,
              transfer_id: row.transfer_id || null, // Include transfer_id from CSV
            };
          }).filter((t): t is NonNullable<typeof t> => t !== null);

          if (transactionsToInsert.length === 0) {
            showError("No valid transactions could be prepared from the CSV. Check account names, amounts, and currency column.");
            setIsImporting(false);
            return;
          }

          // Step 3: Insert transactions
          const { error } = await supabase.from('transactions').insert(transactionsToInsert);
          if (error) throw error;

          showSuccess(`${transactionsToInsert.length} transactions imported successfully!`);
          fetchTransactions(); // Re-fetch transactions to update the display
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
      "Date": formatDateToDDMMYYYY(t.date), // Format date to DD-MMM-YYYY for export
      "Account": t.account,
      "Vendor": t.vendor,
      "Category": t.category,
      "Amount": t.amount,
      "Remarks": t.remarks,
      "Currency": t.currency,
      "transfer_id": t.transfer_id || null, // Include transfer_id for export
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
    dateRange,
    isRefreshing,
    isImporting,
    selectedTransactionIds,
    isBulkDeleteConfirmOpen,
    fileInputRef,
    availableAccountOptions,
    availableCategoryOptions,
    filteredTransactions,
    totalPages,
    startIndex,
    endIndex,
    currentTransactions,
    numSelected,
    rowCount,
    accountCurrencyMap,
    formatCurrency,
    isAllSelectedOnPage,

    // Setters
    setCurrentPage,
    setItemsPerPage,
    setSearchTerm,
    setSelectedAccounts,
    setSelectedCategories,
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
    fetchTransactions, // Expose for dialogs if needed
    refetchAllPayees, // Expose for dialogs if needed
  };
};