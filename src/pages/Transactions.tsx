"use client";

import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import TransactionTable from "@/components/transactions/TransactionTable";
// import TransactionDialog from "@/components/transactions/TransactionDialog";
import AddEditTransactionDialog from "@/components/AddEditTransactionDialog";
import { useSession } from "@/hooks/useSession";
import Papa from "papaparse";
import CSVMappingDialog from "@/components/transactions/CSVMappingDialog";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { parseRobustDate, parseRobustAmount } from "@/utils/importUtils";
import { showError, showSuccess } from "@/utils/toast"; // Import showSuccess
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";

import { slugify } from "@/lib/utils";

const Transactions = () => {
  const session = useSession();
  const {
    transactions: allTransactions,
    isLoadingTransactions,
    deleteMultipleTransactions,
    invalidateAllData,
    addTransaction,
    detectAndLinkTransfers
  } = useTransactions();

  const {
    selectedAccounts,
    selectedCategories,
    selectedSubCategories,
    selectedVendors,
    dateRange,
    excludeTransfers,
    minAmount,
    maxAmount,
    searchTerm,
    limit,
    sortOrder,
    setDateRange,
    // Setters needed for navigation state handling
    setSelectedAccounts,
    setSelectedCategories,
    setSelectedSubCategories,
    setSelectedVendors,
    handleResetFilters
  } = useTransactionFilters();

  const location = useLocation();
  const navigate = useNavigate();

  // Handle incoming navigation state (filters)
  React.useEffect(() => {
    if (location.state) {
      const state = location.state as {
        filterCategory?: string;
        filterSubCategory?: string;
        filterAccount?: string;
        filterVendor?: string;
        filterAccounts?: string[]; // Support multiple accounts
        filterDateRange?: { from: string; to: string }; // Support date range (passed as strings usually via JSON)
      };

      if (state.filterCategory || state.filterSubCategory || state.filterAccount || state.filterVendor || state.filterAccounts || state.filterDateRange) {
        // Reset existing filters first to ensure clean state
        handleResetFilters();

        if (state.filterCategory) {
          setSelectedCategories([slugify(state.filterCategory)]);
        }
        if (state.filterSubCategory) {
          setSelectedSubCategories([slugify(state.filterSubCategory)]);
        }
        if (state.filterAccount) {
          setSelectedAccounts([slugify(state.filterAccount)]);
        }
        if (state.filterAccounts && Array.isArray(state.filterAccounts)) {
          setSelectedAccounts(state.filterAccounts.map(a => slugify(a)));
        }
        if (state.filterVendor) {
          setSelectedVendors([slugify(state.filterVendor)]);
        }
        if (state.filterDateRange && state.filterDateRange.from && state.filterDateRange.to) {
          setDateRange({
            from: new Date(state.filterDateRange.from),
            to: new Date(state.filterDateRange.to)
          });
        }

        // Clear state using navigate to ensure React Router is aware and prevents loops
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, navigate, location.pathname, setSelectedAccounts, setSelectedCategories, setSelectedSubCategories, setSelectedVendors, handleResetFilters, setDateRange]);

  const dataProvider = useDataProvider();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const filteredTransactions = React.useMemo(() => {
    let result = allTransactions.filter(t => {
      // Date Range
      if (dateRange?.from) {
        const tDate = new Date(t.date);
        if (tDate < dateRange.from) return false;
        if (dateRange.to) {
          // Set end of day for 'to' date to be inclusive
          const endDate = new Date(dateRange.to);
          endDate.setHours(23, 59, 59, 999);
          if (tDate > endDate) return false;
        }
      }

      // Accounts
      if (selectedAccounts.length > 0 && !selectedAccounts.includes(slugify(t.account))) return false;

      // Categories
      if (selectedCategories.length > 0 && !selectedCategories.includes(slugify(t.category))) return false;

      // Sub-categories
      if (selectedSubCategories.length > 0 && !selectedSubCategories.includes(slugify(t.sub_category || ''))) return false;

      // Vendors
      if (selectedVendors.length > 0 && !selectedVendors.includes(slugify(t.vendor))) return false;

      // Exclude Transfers
      if (excludeTransfers && (t.category === 'Transfer' || !!t.transfer_id)) return false;

      // Amount (Magnitude check for intuitive searching like "> 100")
      if (minAmount !== undefined && Math.abs(t.amount) < minAmount) return false;
      if (maxAmount !== undefined && Math.abs(t.amount) > maxAmount) return false;

      // Search Term
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        return (
          (t.remarks || "").toLowerCase().includes(lower) ||
          (t.vendor || "").toLowerCase().includes(lower) ||
          (t.category || "").toLowerCase().includes(lower) ||
          (t.sub_category || "").toLowerCase().includes(lower) ||
          t.amount.toString().includes(lower)
        );
      }

      return true;
    });

    // Sorting
    if (sortOrder === 'largest') {
      result.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    } else if (sortOrder === 'smallest') {
      result.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    } else {
      // Default sort by date desc
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // Limiting
    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [allTransactions, selectedAccounts, selectedCategories, selectedSubCategories, selectedVendors, dateRange, excludeTransfers, minAmount, maxAmount, searchTerm, limit, sortOrder]);


  // Scheduled Transaction State - Stubbed for local migration
  const handleScheduleTransactions = (_selectedTransactions: any[], clearSelection: () => void) => {
    // Disabled for migration
    toast({
      title: "Feature Unavailable",
      description: "Scheduling transactions is currently unavailable in offline mode.",
    });
    clearSelection();
  };

  const REQUIRED_HEADERS = [
    "Date",
    "Account",
    "Payee", // Renamed from Vendor
    "Category",
    "Subcategory", // Moved before Amount/Currency
    "Currency",
    "Amount",
    "Notes", // Renamed from Remarks
    "Frequency",
    "End Date",
    "Transfer ID",
    "Account Type"
  ];

  const handleExport = () => {
    let dataToExport = filteredTransactions.map(t => ({
      "Date": t.date ? parseRobustDate(t.date)?.split('T')[0] : t.date,
      "Account": t.account,
      "Payee": t.vendor,
      "Category": t.category,
      "Subcategory": t.sub_category,
      "Amount": t.amount,
      "Notes": t.remarks,
      "Currency": t.currency,
      "Frequency": t.recurrence_frequency || "",
      "End Date": t.recurrence_end_date || "",
      "Transfer ID": t.transfer_id || ""
    }));

    let fileName = "transactions.csv";

    if (filteredTransactions.length === 0) {
      const today = new Date().toISOString().split("T")[0];
      const transferId1 = "TRF-SAME-" + Math.random().toString(36).substr(2, 4).toUpperCase();
      const transferId2 = "TRF-DIFF-" + Math.random().toString(36).substr(2, 4).toUpperCase();

      dataToExport = [
        {
          "Date": today,
          "Account": "Cash",
          "Payee": "Starbucks",
          "Category": "Food & Drink",
          "Subcategory": "Coffee",
          "Amount": -5.5,
          "Notes": "Morning coffee",
          "Currency": "USD",
          "Frequency": "",
          "End Date": "",
          "Transfer ID": ""
        },
        // ... (preserving other template items, just adding Subcategory key to them roughly if needed, or just let them be empty/undefined for others if TS allows, but map logic above needs consistency. Let's assume the template items below need update or the map above handles it.
        // Actually, the template generation below creates objects directly. I need to update them all to have Subcategory key for consistency.)
        {
          "Date": today,
          "Account": "Checking",
          "Payee": "Employer",
          "Category": "Income",
          "Subcategory": "Salary",
          "Amount": 3000,
          "Notes": "Monthly Salary",
          "Currency": "USD",
          "Frequency": "",
          "End Date": "",
          "Transfer ID": ""
        },
        // Same Currency Transfer
        {
          "Date": today,
          "Account": "Checking",
          "Payee": "Transfer",
          "Category": "Transfer",
          "Subcategory": "",
          "Amount": -500,
          "Notes": "To Savings",
          "Currency": "USD",
          "Frequency": "",
          "End Date": "",
          "Transfer ID": transferId1
        },
        {
          "Date": today,
          "Account": "Savings",
          "Payee": "Transfer",
          "Category": "Transfer",
          "Subcategory": "",
          "Amount": 500,
          "Notes": "From Checking",
          "Currency": "USD",
          "Frequency": "",
          "End Date": "",
          "Transfer ID": transferId1
        },
        // Tricky: Unicode and formatting
        {
          "Date": today,
          "Account": "Wallet (INR)",
          "Payee": "Friend",
          "Category": "Gifts",
          "Subcategory": "Birthday",
          "Amount": 500,
          "Notes": "Diwali Gift ₹500", // Unicode character
          "Currency": "INR", // Different currency
          "Frequency": "",
          "End Date": "",
          "Transfer ID": ""
        },
        // Different Currency Transfer (e.g. USD to EUR)
        {
          "Date": today,
          "Account": "Checking (USD)",
          "Payee": "Currency Exchange",
          "Category": "Transfer",
          "Subcategory": "",
          "Amount": -100,
          "Notes": "Exchange 100 USD to EUR",
          "Currency": "USD",
          "Frequency": "",
          "End Date": "",
          "Transfer ID": transferId2
        },
        {
          "Date": today,
          "Account": "Wallet (EUR)",
          "Payee": "Currency Exchange",
          "Category": "Transfer",
          "Subcategory": "",
          "Amount": 92,
          "Notes": "Received EUR from USD exchange",
          "Currency": "EUR",
          "Frequency": "",
          "End Date": "",
          "Transfer ID": transferId2
        }
      ];
      fileName = "transaction_template.csv";
      toast({
        title: "Template Downloaded",
        description: "A template with headers and example transfers has been generated.",
      });
    }

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const [mappingDialogState, setMappingDialogState] = useState<{
    isOpen: boolean;
    file: File | null;
  }>({
    isOpen: false,
    file: null,
  });

  const processImport = async (data: any[], config?: any) => {
    try {
      const userId = session?.user?.id;
      if (!userId) {
        showError("User not logged in");
        return;
      }

      const isReplace = config?.importMode === 'replace';

      if (isReplace) {
        console.log("Import mode is REPLACE. Clearing existing transactions...");
        await dataProvider.clearTransactions(userId);
        await dataProvider.clearBudgets(userId);
        await dataProvider.clearScheduledTransactions(userId);
        // We technically don't clear definitions (categories/accounts) on replace unless we want to start fresh-fresh.
        // Usually "Replace Data" in apps means "Replace Transactions".
        // If user wants to clean definitions, they might need a "Reset Account" feature.
        // But for "Added" counts, we should check what exists *now*.
      }

      console.log("Starting import with data:", data.length, "rows", config);

      // Track known IDs to calculate "Added"
      const knownAccountIds = new Set<string>();
      const knownVendorIds = new Set<string>();
      const knownCategoryIds = new Set<string>();
      const knownSubCategoryIds = new Set<string>();

      // Populate known IDs from current state if NOT replacing everything (or even if we are, definitions might persist)
      // Actually, standard "replace" usually keeps categories/accounts to preserve structure for other years?
      // Assuming definitions persist.
      const existingVendors = await dataProvider.getAllVendors();
      existingVendors.forEach(v => {
        if (v.is_account) knownAccountIds.add(v.id);
        else knownVendorIds.add(v.id);
      });
      const existingCategories = await dataProvider.getUserCategories(userId);
      existingCategories.forEach(c => knownCategoryIds.add(c.id));
      const existingSubCategories = await dataProvider.getSubCategories(userId);
      existingSubCategories.forEach(s => knownSubCategoryIds.add(s.id));


      // 1. Process Accounts
      let newAccountsCount = 0;
      const uniqueAccounts = [...new Set(data.map((r: any) => (r.Account || "").trim()).filter(Boolean))];

      for (const name of uniqueAccounts) {
        // Find currency/type from first occurrence, lenient lookup
        const row = data.find((r: any) => (r.Account || "").trim() === name);
        const currency = row?.Currency || 'USD';
        const type = row?.["Account Type"];

        const id = await dataProvider.ensurePayeeExists(name, true, { currency, type });
        if (id && !knownAccountIds.has(id)) {
          newAccountsCount++;
          knownAccountIds.add(id);
        } else if (id && !knownVendorIds.has(id) && !knownAccountIds.has(id)) {
          // ...
        }
      }

      // 2. Process Payees
      let newVendorsCount = 0;
      const uniquePayees = [...new Set(data.map((r: any) => (r.Payee || r.Vendor || "").trim()).filter(Boolean))];
      for (const name of uniquePayees) {
        const id = await dataProvider.ensurePayeeExists(name, false);
        // ...
        if (id && !knownVendorIds.has(id) && !knownAccountIds.has(id)) {
          newVendorsCount++;
          knownVendorIds.add(id);
        }
      }

      // 3. Process Categories & Sub-categories
      let newCategoriesCount = 0;
      let newSubCategoriesCount = 0;

      // Map Category Name -> ID (needed for subcats)
      const categoryNameIdMap = new Map<string, string>();
      // Pre-fill map with existing
      existingCategories.forEach(c => categoryNameIdMap.set(c.name, c.id));

      const uniqueCategories = [...new Set(data.map((r: any) => (r.Category || "").trim()).filter(Boolean))];
      for (const name of uniqueCategories) {
        const id = await dataProvider.ensureCategoryExists(name, userId);
        if (id) {
          if (!knownCategoryIds.has(id)) {
            newCategoriesCount++;
            knownCategoryIds.add(id);
          }
          categoryNameIdMap.set(name, id);
        }
      }

      // Process Sub-categories
      // We need distinct pairs of (Category, SubCategory)
      const uniqueSubCats = new Set<string>(); // "Cat:Sub"
      data.forEach((r: any) => {
        const cat = (r.Category || "").trim();
        const sub = (r.Subcategory || r.Sub_Category || "").trim();
        if (cat && sub) {
          uniqueSubCats.add(`${cat}:${sub}`);
        }
      });

      for (const item of Array.from(uniqueSubCats)) {
        const [catName, subName] = item.split(':');
        const catId = categoryNameIdMap.get(catName);
        if (catId && subName) {
          const id = await dataProvider.ensureSubCategoryExists(subName, catId, userId);
          if (id && !knownSubCategoryIds.has(id)) {
            newSubCategoriesCount++;
            knownSubCategoryIds.add(id);
          }
        }
      }


      // 4. Prepare Transactions
      const transactionsToInsert: any[] = [];
      let skippedCount = 0;

      for (const row of data) {
        // Validation
        const amount = parseRobustAmount(row.Amount, config?.decimalSeparator);
        const date = parseRobustDate(row.Date, config?.dateFormat);

        if (!date) {
          skippedCount++;
          continue;
        }

        const t = {
          user_id: userId,
          date: date, // validated above
          account: (row.Account || row.account || "Uncategorized Account").trim(),
          vendor: (row.Payee || row.Vendor || row.Counterparty || row.Transfer || row.payee || row.vendor || row.counterparty || row.transfer || "").trim(),
          category: (row.Category || row.category || "Uncategorized").trim(),
          sub_category: (row.Subcategory || row.Sub_Category || row.subcategory || row["sub-category"] || "").trim(),
          amount: amount,
          remarks: (row.Notes || row.Remarks || row.notes || row.remarks || "").trim(),
          currency: (row.Currency || row.currency || "USD").trim(),
          recurrence_frequency: row.Frequency || row.frequency || null,
          recurrence_end_date: parseRobustDate(row["End Date"] || row["end date"], config?.dateFormat) || null,
          transfer_id: (row["Transfer ID"] || row["transfer id"] || "").trim() || null,
        };
        transactionsToInsert.push(t);
      }

      if (transactionsToInsert.length === 0) {
        toast({
          title: "Import Failed",
          description: "No valid transactions found. Please checks your date and amount column mappings.",
          variant: "destructive"
        });
        return;
      }

      // 5. Insert
      try {
        for (const t of transactionsToInsert) {
          await dataProvider.addTransaction(t);
        }
      } catch (e: any) {
        console.error("Insert failed at some point", e);
        // insertError was unused
      }

      let desc = `Imported ${transactionsToInsert.length} transactions.`;
      const details = [];
      if (newAccountsCount > 0) details.push(`${newAccountsCount} accounts`);
      if (newVendorsCount > 0) details.push(`${newVendorsCount} vendors`);
      if (newCategoriesCount > 0) details.push(`${newCategoriesCount} categories`);
      if (newSubCategoriesCount > 0) details.push(`${newSubCategoriesCount} sub-categories`);

      if (details.length > 0) {
        desc += ` Added ${details.join(', ')}.`;
      }

      if (skippedCount > 0) {
        desc += ` Skipped ${skippedCount} invalid rows.`;
      }

      // Auto-detect transfers (and combine message)
      try {
        const linkedCount = await detectAndLinkTransfers();
        if (linkedCount > 0) {
          desc += ` Automatically linked ${linkedCount} transfer pairs.`;
        }
      } catch (e) {
        console.error("Transfer detection failed", e);
      }

      toast({
        title: "Import Successful",
        description: desc,
        duration: 5000,
      });

      invalidateAllData();
    } catch (error: any) {
      toast({
        title: "Error importing transactions",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMappingConfirm = (data: any[], config: any) => {
    processImport(data, config);
    setMappingDialogState((prev: any) => ({ ...prev, isOpen: false }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMappingDialogState({
      isOpen: true,
      file: file
    });

    event.target.value = '';
  };

  return (
    <div className="space-y-6 p-6 rounded-xl min-h-[calc(100vh-100px)] transition-all duration-500 bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="flex flex-col gap-6 mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              Transactions
            </h1>
            <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">Manage & track your financial activities</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <Button variant="outline" onClick={handleImportClick} className="flex-1 sm:flex-none">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={async () => {
              const count = await detectAndLinkTransfers();
              if (count > 0) {
                showSuccess(`Successfully linked ${count} transfer pairs.`);
              } else {
                toast({ title: "No transfers detected", description: "Checked all uncategorized transactions for matching pairs." });
              }
            }} className="flex-1 sm:flex-none">
              <RefreshCw className="mr-2 h-4 w-4" />
              Detect Transfers
            </Button>
            <Button onClick={() => { setEditingTransaction(null); setIsDialogOpen(true); }} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Smart Search */}
        <SearchFilterBar />

      </div>

      <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <TransactionTable
          transactions={filteredTransactions} // Use filtered transactions
          loading={isLoadingTransactions}
          onRefresh={invalidateAllData}
          onDeleteTransactions={deleteMultipleTransactions}
          onAddTransaction={addTransaction}
          onScheduleTransactions={handleScheduleTransactions}
          onRowDoubleClick={(transaction) => {
            setEditingTransaction(transaction);
            setIsDialogOpen(true);
          }}
        />
      </div>

      <AddEditTransactionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={invalidateAllData}
        transactionToEdit={editingTransaction}
      />

      <CSVMappingDialog
        isOpen={mappingDialogState.isOpen}
        onClose={() => setMappingDialogState((prev: any) => ({ ...prev, isOpen: false }))}
        file={mappingDialogState.file}
        requiredHeaders={REQUIRED_HEADERS}
        onConfirm={handleMappingConfirm}
      />
    </div>
  );
};

export default Transactions;