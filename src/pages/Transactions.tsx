"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload, FilterX, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import TransactionTable from "@/components/transactions/TransactionTable";
import TransactionDialog from "@/components/transactions/TransactionDialog";
import { useSession } from "@/hooks/useSession";
import Papa from "papaparse";
import CSVMappingDialog from "@/components/transactions/CSVMappingDialog";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { parseRobustDate, parseRobustAmount } from "@/utils/importUtils";
import { useNavigate, useLocation } from "react-router-dom";
import { showError, showSuccess } from "@/utils/toast"; // Import showSuccess

const Transactions = () => {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    transactions: allTransactions,
    isLoadingTransactions,
    accounts,
    vendors,
    categories,
    updateTransaction,
    deleteMultipleTransactions,
    invalidateAllData,
    addTransaction,
    detectAndLinkTransfers
  } = useTransactions();
  const dataProvider = useDataProvider();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Filter State
  const [activeFilters, setActiveFilters] = useState<{
    account?: string;
    vendor?: string;
    category?: string;
  }>({});

  React.useEffect(() => {
    if (location.state) {
      const { filterAccount, filterVendor, filterCategory } = location.state;
      if (filterAccount || filterVendor || filterCategory) {
        setActiveFilters({
          account: filterAccount,
          vendor: filterVendor,
          category: filterCategory
        });
      }
    }
  }, [location.state]);

  const clearFilters = () => {
    setActiveFilters({});
    // Clear location state without reloading or navigating away
    navigate(location.pathname, { replace: true, state: {} });
  };

  const filteredTransactions = React.useMemo(() => {
    return allTransactions.filter(t => {
      if (activeFilters.account && t.account !== activeFilters.account) return false;
      if (activeFilters.vendor && t.vendor !== activeFilters.vendor) return false;
      if (activeFilters.category && t.category !== activeFilters.category) return false;
      return true;
    });
  }, [allTransactions, activeFilters]);


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
      }

      console.log("Starting import with data:", data.length, "rows", config);
      // 1. Ensure Entities Exist
      const uniqueAccounts = [...new Set(data.map((r: any) => r.Account).filter(Boolean))];
      await Promise.all(uniqueAccounts.map(name => {
        // Find currency for this account from the first row that has this account
        const row = data.find((r: any) => r.Account === name);
        const currency = row?.Currency || 'USD'; // Default if missing
        const type = row?.["Account Type"];
        return dataProvider.ensurePayeeExists(name, true, { currency, type });
      }));

      const uniquePayees = [...new Set(data.map((r: any) => r.Payee || r.Vendor).filter(Boolean))];
      await Promise.all(uniquePayees.map(name => dataProvider.ensurePayeeExists(name, false)));

      const uniqueCategories = [...new Set(data.map((r: any) => r.Category).filter(Boolean))];
      await Promise.all(uniqueCategories.map(name => dataProvider.ensureCategoryExists(name, userId)));

      // 2. Prepare Transactions
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
        // Note: Amount 0 is technically valid but often a parsing error. We'll allow it but warn in logs.

        const t = {
          user_id: userId,
          date: date, // validated above
          account: row.Account || "Uncategorized Account", // Fallback to avoid undefined
          vendor: row.Payee || row.Vendor || "",
          category: row.Category || "Uncategorized",
          sub_category: row.Subcategory || row.Sub_Category || "",
          amount: amount,
          remarks: row.Notes || row.Remarks || "",
          currency: row.Currency || "USD",
          recurrence_frequency: row.Frequency || null,
          recurrence_end_date: parseRobustDate(row["End Date"], config?.dateFormat) || null,
          transfer_id: row["Transfer ID"] || null,
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

      // 3. Insert
      for (const t of transactionsToInsert) {
        await dataProvider.addTransaction(t);
      }

      // Auto-detect transfers
      const linkedCount = await detectAndLinkTransfers();

      let desc = `Successfully imported ${transactionsToInsert.length} transactions.`;
      if (linkedCount > 0) {
        desc += ` Automatically linked ${linkedCount} transfer pairs.`;
      }
      if (skippedCount > 0) {
        desc += ` (${skippedCount} rows skipped due to invalid data)`;
      }

      toast({
        title: "Import Successful",
        description: desc,
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
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage and track your financial activities.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Filter Indicator / Reset Button */}
          {(activeFilters.account || activeFilters.vendor || activeFilters.category) && (
            <Button variant="secondary" onClick={clearFilters} className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400">
              <FilterX className="mr-2 h-4 w-4" />
              Reset Filters
              {(activeFilters.account || activeFilters.vendor || activeFilters.category) &&
                <span className="ml-2 text-xs opacity-70">
                  ({activeFilters.account || activeFilters.vendor || activeFilters.category})
                </span>
              }
            </Button>
          )}

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
          <Button onClick={() => setIsDialogOpen(true)} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <TransactionTable
        transactions={filteredTransactions} // Use filtered transactions
        loading={isLoadingTransactions}
        onRefresh={invalidateAllData}
        accounts={accounts}
        vendors={vendors}
        categories={categories}
        onUpdateTransaction={updateTransaction}
        onDeleteTransactions={deleteMultipleTransactions}
        onAddTransaction={addTransaction}
        onScheduleTransactions={handleScheduleTransactions}
      />

      <TransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={invalidateAllData}
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