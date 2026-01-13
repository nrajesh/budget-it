"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import TransactionTable from "@/components/transactions/TransactionTable";
import TransactionDialog from "@/components/transactions/TransactionDialog";
import { useSession } from "@/hooks/useSession";
import Papa from "papaparse";
import CSVMappingDialog from "@/components/transactions/CSVMappingDialog";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useDataProvider } from "@/context/DataProviderContext";
// import { Transaction } from "@/data/finance-data"; // Removed unused import
import { parseRobustDate, parseRobustAmount } from "@/utils/importUtils";
// import { AddEditScheduledTransactionDialog } from "@/components/scheduled-transactions/AddEditScheduledTransactionDialog";
// import { BatchScheduleDialog } from "@/components/scheduled-transactions/BatchScheduleDialog";
// import { useScheduledTransactionManagement } from "@/hooks/useScheduledTransactionManagement";


const Transactions = () => {
  const session = useSession();
  const {
    transactions,
    isLoadingTransactions,
    accounts,
    vendors,
    categories,
    updateTransaction,
    deleteMultipleTransactions,
    invalidateAllData,
    addTransaction
  } = useTransactions();
  const dataProvider = useDataProvider();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Scheduled Transaction State - Stubbed for local migration
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [transactionToSchedule, setTransactionToSchedule] = useState<any>(null);
  /*
  const {
    saveMutation: saveScheduledMutation,
    allPayees: scheduledPayees,
    categories: scheduledCategories,
    allSubCategories: scheduledSubCategories,
    isLoading: isLoadingScheduledData
  } = useScheduledTransactionManagement();
  */

  // Batch Schedule State
  const [isBatchScheduleOpen, setIsBatchScheduleOpen] = useState(false);
  const [batchTransactions, setBatchTransactions] = useState<any[]>([]);
  // const [clearSelectionCallback, setClearSelectionCallback] = useState<(() => void) | null>(null);

  const handleScheduleTransactions = (selectedTransactions: any[], clearSelection: () => void) => {
      // Disabled for migration
      toast({
          title: "Feature Unavailable",
          description: "Scheduling transactions is currently unavailable in offline mode.",
      });
      clearSelection();
  };

  /*
  const handleBatchConfirm = (settings: { frequency_value: number, frequency_unit: string, date: string }) => {
    batchTransactions.forEach(t => {
      const payload = {
        date: new Date(settings.date).toISOString(),
        account: t.account,
        vendor: t.vendor,
        category: t.category,
        sub_category: t.sub_category,
        amount: t.amount,
        remarks: t.remarks,
        frequency_value: settings.frequency_value,
        frequency_unit: settings.frequency_unit,
        recurrence_end_date: null
      };
      saveScheduledMutation.mutate(payload);
    });

    if (clearSelectionCallback) {
      clearSelectionCallback();
      setClearSelectionCallback(null);
    }
    setBatchTransactions([]);
  };
  */

  const REQUIRED_HEADERS = [
    "Date",
    "Account",
    "Payee", // Renamed from Vendor
    "Category",
    "Amount",
    "Subcategory", // Added Subcategory
    "Notes", // Renamed from Remarks
    "Currency", // Optional? Mapping dialog handles it, but let's keep it here for auto-validation success if present
    "Frequency",
    "End Date",
    "Transfer ID"
  ];

  const handleExport = () => {
    let dataToExport = transactions.map(t => ({
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

    if (transactions.length === 0) {
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
    csvHeaders: string[];
    csvData: any[];
  }>({
    isOpen: false,
    csvHeaders: [],
    csvData: [],
  });

  const processImport = async (data: any[]) => {
    try {
      const userId = session?.user?.id;
      if (!userId) {
          showError("User not logged in");
          return;
      }

      // 1. Ensure Entities Exist
      const uniqueAccounts = [...new Set(data.map((r: any) => r.Account).filter(Boolean))];
      await Promise.all(uniqueAccounts.map(name => {
        // Find currency for this account from the first row that has this account
        const row = data.find((r: any) => r.Account === name);
        const currency = row?.Currency || 'USD'; // Default if missing
        return dataProvider.ensurePayeeExists(name, true, { currency });
      }));

      const uniquePayees = [...new Set(data.map((r: any) => r.Payee || r.Vendor).filter(Boolean))];
      await Promise.all(uniquePayees.map(name => dataProvider.ensurePayeeExists(name, false)));

      const uniqueCategories = [...new Set(data.map((r: any) => r.Category).filter(Boolean))];
      await Promise.all(uniqueCategories.map(name => dataProvider.ensureCategoryExists(name, userId)));

      // 2. Prepare Transactions
      // Since addTransaction processes one by one in DataProvider interface (usually),
      // but supabase allows bulk insert. DataProvider interface currently only has addTransaction (singular).
      // For now, we will loop. Later we can optimize DataProvider to support bulkAddTransaction.

      const transactionsToInsert = data.map((row: any) => ({
        user_id: userId,
        date: parseRobustDate(row.Date) || new Date().toISOString(),
        account: row.Account,
        vendor: row.Payee || row.Vendor || "",
        category: row.Category,
        sub_category: row.Subcategory || row.Sub_Category || "",
        amount: parseRobustAmount(row.Amount),
        remarks: row.Notes || row.Remarks || "",
        currency: row.Currency,
        recurrence_frequency: row.Frequency || null,
        recurrence_end_date: parseRobustDate(row["End Date"]) || null,
        transfer_id: row["Transfer ID"] || null,
      }));

      // NOTE: This will be slower than bulk insert, but standardizes it.
      // If performance is an issue, we should add bulkInsert to DataProvider.
      for (const t of transactionsToInsert) {
          await dataProvider.addTransaction(t);
      }

      toast({
        title: "Import Successful",
        description: `Successfully imported ${transactionsToInsert.length} transactions.`,
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

  const handleMappingConfirm = (mapping: Record<string, string>) => {
    const mappedData = mappingDialogState.csvData.map((row: any) => {
      const newRow: any = {};
      Object.entries(mapping).forEach(([requiredHeader, csvHeader]) => {
        newRow[requiredHeader] = row[csvHeader];
      });
      return newRow;
    });

    processImport(mappedData);
    setMappingDialogState((prev: any) => ({ ...prev, isOpen: false }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        const headers = results.meta.fields || [];
        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          // Instead of failing, open mapping dialog
          setMappingDialogState({
            isOpen: true,
            csvHeaders: headers,
            csvData: results.data,
          });
          return;
        }

        processImport(results.data);
      },
      error: (error: any) => {
        toast({
          title: "File reading error",
          description: error.message,
          variant: "destructive",
        });
      }
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <TransactionTable
        transactions={transactions}
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

      {/*
      <AddEditScheduledTransactionDialog
        isOpen={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        transaction={transactionToSchedule}
        onSubmit={(values) => saveScheduledMutation.mutate(values)}
        isSubmitting={saveScheduledMutation.isPending}
        accounts={accounts}
        allPayees={scheduledPayees}
        categories={scheduledCategories}
        allSubCategories={scheduledSubCategories}
        isLoading={isLoadingScheduledData}
      />

      <BatchScheduleDialog
        isOpen={isBatchScheduleOpen}
        onOpenChange={setIsBatchScheduleOpen}
        count={batchTransactions.length}
        onConfirm={handleBatchConfirm}
      />
      */}

      <CSVMappingDialog
        isOpen={mappingDialogState.isOpen}
        onClose={() => setMappingDialogState((prev: any) => ({ ...prev, isOpen: false }))}
        csvHeaders={mappingDialogState.csvHeaders}
        requiredHeaders={REQUIRED_HEADERS}
        onConfirm={handleMappingConfirm}
      />
    </div>
  );
};

export default Transactions;