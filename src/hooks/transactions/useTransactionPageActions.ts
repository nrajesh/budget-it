import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { useLedger } from "@/contexts/LedgerContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import {
  parseRobustDate,
  parseRobustAmount,
  parseRobustFrequency,
} from "@/utils/importUtils";
import { showError, showSuccess } from "@/utils/toast";
import { useToast } from "@/components/ui/use-toast";
import { slugify } from "@/lib/utils";
import { Transaction, AccountType, Ledger } from "@/types/dataProvider";

export interface ImportConfig {
  importMode?: "replace" | "append";
  decimalSeparator?: "." | ",";
  dateFormat?: string;
}

export interface ExportRow {
  Date: string | undefined;
  Account: string;
  Payee: string;
  Category: string;
  Subcategory: string;
  Amount: number;
  Notes: string;
  Currency: string;
  Frequency: string;
  "End Date": string;
  "Transfer ID": string;
}

// Loose interface for raw CSV rows since headers can vary
export interface ImportRow {
  [key: string]: string | undefined;
  Date?: string;
  date?: string;
  Account?: string;
  account?: string;
  "Account Type"?: string;
  Payee?: string;
  payee?: string;
  Vendor?: string;
  vendor?: string;
  Counterparty?: string;
  counterparty?: string;
  Transfer?: string;
  transfer?: string;
  Category?: string;
  category?: string;
  Subcategory?: string;
  subcategory?: string;
  Sub_Category?: string;
  "sub-category"?: string;
  Amount?: string;
  amount?: string;
  Notes?: string;
  notes?: string;
  Remarks?: string;
  remarks?: string;
  Currency?: string;
  currency?: string;
  Frequency?: string;
  frequency?: string;
  "End Date"?: string;
  "end date"?: string;
  "Transfer ID"?: string;
  "transfer id"?: string;
}

/**
 * Custom hook to handle high-level actions on the Transactions page,
 * such as exporting data, handling CSV imports (with robust processing),
 * and triggering transfer detection.
 *
 * @param filteredTransactions - The list of transactions currently visible/filtered on the page, used for export.
 */
export const useTransactionPageActions = (
  filteredTransactions: Transaction[],
) => {
  const { activeLedger }: { activeLedger: Ledger | null } = useLedger();
  const dataProvider = useDataProvider();
  const { detectAndLinkTransfers, setOperationProgress, invalidateAllData } =
    useTransactions();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mappingDialogState, setMappingDialogState] = useState<{
    isOpen: boolean;
    file: File | null;
  }>({
    isOpen: false,
    file: null,
  });

  // --- Export Logic ---
  const handleExport = () => {
    let dataToExport: ExportRow[] = filteredTransactions.map((t) => ({
      Date: t.date ? parseRobustDate(t.date)?.split("T")[0] : t.date,
      Account: t.account,
      Payee: t.vendor,
      Category: t.category,
      Subcategory: t.sub_category || "",
      Amount: t.amount,
      Notes: t.remarks || "",
      Currency: t.currency,
      Frequency: t.recurrence_frequency || "",
      "End Date": t.recurrence_end_date || "",
      "Transfer ID": t.transfer_id || "",
    }));

    let fileName = activeLedger
      ? `${slugify(activeLedger.name)}_transactions.csv`
      : "transactions.csv";

    // Template Generation if empty
    if (filteredTransactions.length === 0) {
      const today = new Date().toISOString().split("T")[0];
      const transferId1 =
        "TRF-SAME-" + Math.random().toString(36).substr(2, 4).toUpperCase();
      const transferId2 =
        "TRF-DIFF-" + Math.random().toString(36).substr(2, 4).toUpperCase();

      dataToExport = [
        {
          Date: today,
          Account: "Cash",
          Payee: "Starbucks",
          Category: "Food & Drink",
          Subcategory: "Coffee",
          Amount: -5.5,
          Notes: "Morning coffee",
          Currency: "USD",
          Frequency: "",
          "End Date": "",
          "Transfer ID": "",
        },
        {
          Date: today,
          Account: "Checking",
          Payee: "Employer",
          Category: "Income",
          Subcategory: "Salary",
          Amount: 3000,
          Notes: "Monthly Salary",
          Currency: "USD",
          Frequency: "",
          "End Date": "",
          "Transfer ID": "",
        },
        {
          Date: today,
          Account: "Checking",
          Payee: "Transfer",
          Category: "Transfer",
          Subcategory: "",
          Amount: -500,
          Notes: "To Savings",
          Currency: "USD",
          Frequency: "",
          "End Date": "",
          "Transfer ID": transferId1,
        },
        {
          Date: today,
          Account: "Savings",
          Payee: "Transfer",
          Category: "Transfer",
          Subcategory: "",
          Amount: 500,
          Notes: "From Checking",
          Currency: "USD",
          Frequency: "",
          "End Date": "",
          "Transfer ID": transferId1,
        },
        {
          Date: today,
          Account: "Wallet (INR)",
          Payee: "Friend",
          Category: "Gifts",
          Subcategory: "Birthday",
          Amount: 500,
          Notes: "Diwali Gift ₹500",
          Currency: "INR",
          Frequency: "",
          "End Date": "",
          "Transfer ID": "",
        },
        {
          Date: today,
          Account: "Checking (USD)",
          Payee: "Currency Exchange",
          Category: "Transfer",
          Subcategory: "",
          Amount: -100,
          Notes: "Exchange 100 USD to EUR",
          Currency: "USD",
          Frequency: "",
          "End Date": "",
          "Transfer ID": transferId2,
        },
        {
          Date: today,
          Account: "Wallet (EUR)",
          Payee: "Currency Exchange",
          Category: "Transfer",
          Subcategory: "",
          Amount: 92,
          Notes: "Received EUR from USD exchange",
          Currency: "EUR",
          Frequency: "",
          "End Date": "",
          "Transfer ID": transferId2,
        },
      ];
      fileName = "transaction_template.csv";
      toast({
        title: "Template Downloaded",
        description:
          "A template with headers and example transfers has been generated.",
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

  // --- Import Logic ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMappingDialogState({
      isOpen: true,
      file: file,
    });
    event.target.value = "";
  };

  /**
   * Processes the parsed CSV data and inserts it into the database.
   * Handles entity creation (Accounts, Payees, Categories) if they don't exist.
   *
   * @param data - The array of row objects from PapaParse
   * @param config - Configuration options like date format or decimal separator
   */
  const processImport = async (data: ImportRow[], config?: ImportConfig) => {
    try {
      const userId = activeLedger?.id;
      if (!userId) {
        showError(
          "No active ledger selected. Please select a ledger to import transactions.",
        );
        return;
      }

      const isReplace = config?.importMode === "replace";

      if (isReplace) {
        // Log removed
        await dataProvider.clearTransactions(userId);
        await dataProvider.clearBudgets(userId);
        await dataProvider.clearScheduledTransactions(userId);
      }

      // Log removed

      const totalSteps = 4;
      setOperationProgress({
        title: "Importing CSV",
        description: "Preparing to import transactions...",
        stage: "Analyzing Entities...",
        progress: 10,
        totalStages: totalSteps,
      });

      const knownAccountIds = new Set<string>();
      const newAccountNames = new Set<string>();
      const knownVendorIds = new Set<string>();
      const knownCategoryIds = new Set<string>();
      const knownSubCategoryIds = new Set<string>();

      const existingVendors = await dataProvider.getAllVendors(userId);
      existingVendors.forEach((v) => {
        if (v.is_account) knownAccountIds.add(v.id);
        else knownVendorIds.add(v.id);
      });
      const existingCategories = await dataProvider.getUserCategories(userId);
      existingCategories.forEach((c) => knownCategoryIds.add(c.id));
      const existingSubCategories = await dataProvider.getSubCategories(userId);
      existingSubCategories.forEach((s) => knownSubCategoryIds.add(s.id));

      // 1. Process Accounts
      setOperationProgress({
        title: "Importing CSV",
        description: "Processing Accounts...",
        stage: "Stage 1/4: Accounts",
        progress: 10,
        totalStages: 4,
      });
      let newAccountsCount = 0;
      const uniqueAccounts = [
        ...new Set(data.map((r) => (r.Account || "").trim()).filter(Boolean)),
      ];

      for (const name of uniqueAccounts) {
        const row = data.find((r) => (r.Account || "").trim() === name);
        const currency = row?.Currency || "USD";
        const type = row?.["Account Type"] as AccountType | undefined;

        const id = await dataProvider.ensurePayeeExists(name, true, userId, {
          currency,
          type,
        });
        if (id && !knownAccountIds.has(id)) {
          newAccountsCount++;
          knownAccountIds.add(id);
          newAccountNames.add(name);
        }
      }

      // 2. Process Payees
      setOperationProgress({
        title: "Importing CSV",
        description: "Processing Vendors...",
        stage: "Stage 2/4: Vendors",
        progress: 25,
        totalStages: 4,
      });
      let newVendorsCount = 0;
      const uniquePayees = [
        ...new Set(
          data.map((r) => (r.Payee || r.Vendor || "").trim()).filter(Boolean),
        ),
      ];
      for (const name of uniquePayees) {
        const id = await dataProvider.ensurePayeeExists(name, false, userId);
        if (id && !knownVendorIds.has(id) && !knownAccountIds.has(id)) {
          newVendorsCount++;
          knownVendorIds.add(id);
        }
      }

      // 3. Process Categories & Sub-categories
      setOperationProgress({
        title: "Importing CSV",
        description: "Processing Categories...",
        stage: "Stage 3/4: Categories",
        progress: 40,
        totalStages: 4,
      });
      let newCategoriesCount = 0;
      let newSubCategoriesCount = 0;

      const categoryNameIdMap = new Map<string, string>();
      existingCategories.forEach((c) => categoryNameIdMap.set(c.name, c.id));

      const uniqueCategories = [
        ...new Set(data.map((r) => (r.Category || "").trim()).filter(Boolean)),
      ];
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

      const uniqueSubCats = new Set<string>();
      data.forEach((r) => {
        const cat = (r.Category || "").trim();
        const sub = (r.Subcategory || r.Sub_Category || "").trim();
        if (cat && sub) {
          uniqueSubCats.add(`${cat}:${sub}`);
        }
      });

      for (const item of Array.from(uniqueSubCats)) {
        const [catName, subName] = item.split(":");
        const catId = categoryNameIdMap.get(catName);
        if (catId && subName) {
          const id = await dataProvider.ensureSubCategoryExists(
            subName,
            catId,
            userId,
          );
          if (id && !knownSubCategoryIds.has(id)) {
            newSubCategoriesCount++;
            knownSubCategoryIds.add(id);
          }
        }
      }

      // 4. Prepare Transactions
      const transactionsToInsert: Omit<
        Transaction,
        "id" | "created_at" | "updated_at"
      >[] = [];
      let skippedCount = 0;

      for (const row of data) {
        const amountRaw = row.Amount;
        const dateRaw = row.Date;

        if (!amountRaw || !dateRaw) {
          skippedCount++;
          continue;
        }

        const amount = parseRobustAmount(amountRaw, config?.decimalSeparator);
        const date = parseRobustDate(dateRaw, config?.dateFormat);

        if (!date) {
          console.warn(
            "Skipping row due to invalid date. Raw Date:",
            dateRaw,
            "Parsed:",
            date,
            "Row:",
            row,
          );
          skippedCount++;
          continue;
        }

        const t: Omit<Transaction, "id" | "created_at" | "updated_at"> = {
          user_id: userId,
          date: date,
          account: (
            row.Account ||
            row.account ||
            "Uncategorized Account"
          ).trim(),
          vendor: (
            row.Payee ||
            row.Vendor ||
            row.Counterparty ||
            row.Transfer ||
            row.payee ||
            row.vendor ||
            row.counterparty ||
            row.transfer ||
            ""
          ).trim(),
          category: (row.Category || row.category || "Uncategorized").trim(),
          sub_category: (
            row.Subcategory ||
            row.Sub_Category ||
            row.subcategory ||
            row["sub-category"] ||
            ""
          ).trim(),
          amount: amount,
          remarks: (
            row.Notes ||
            row.Remarks ||
            row.notes ||
            row.remarks ||
            ""
          ).trim(),
          currency: (row.Currency || row.currency || "USD").trim(),
          recurrence_frequency: parseRobustFrequency(
            row.Frequency || row.frequency,
          ),
          recurrence_end_date:
            parseRobustDate(
              row["End Date"] || row["end date"] || "",
              config?.dateFormat,
            ) || null,
          transfer_id:
            (row["Transfer ID"] || row["transfer id"] || "").trim() || null,
          is_scheduled_origin: false,
        };
        transactionsToInsert.push(t);
      }

      if (transactionsToInsert.length === 0) {
        toast({
          title: "Import Failed",
          description:
            "No valid transactions found. Please checks your date and amount column mappings.",
          variant: "destructive",
        });
        return;
      }

      // 5. Insert
      setOperationProgress({
        title: "Importing CSV",
        description: `Importing ${transactionsToInsert.length} transactions...`,
        stage: "Stage 4/4: Transactions",
        progress: 55,
        totalStages: 4,
      });
      try {
        let successCount = 0;
        const UPDATE_BATCH = Math.max(
          10,
          Math.floor(transactionsToInsert.length / 20),
        );

        // Batch insert using addMultipleTransactions if available or loop
        // The original code looped addTransaction
        for (const t of transactionsToInsert) {
          await dataProvider.addTransaction(t as Transaction); // Type assertion needed as addTransaction expects Transaction usually but handles omits
          successCount++;
          if (successCount % UPDATE_BATCH === 0) {
            const percent =
              55 +
              Math.floor((successCount / transactionsToInsert.length) * 40);
            setOperationProgress({
              title: "Importing CSV",
              description: `Saving... (${successCount}/${transactionsToInsert.length})`,
              stage: "Stage 4/4: Transactions",
              progress: Math.min(99, percent),
              totalStages: 4,
            });
          }
        }
        // Log removed
      } catch (e: any) {
        console.error("Insert failed at some point", e);
      }

      let desc = `Imported ${transactionsToInsert.length} transactions.`;
      const details = [];
      if (newAccountsCount > 0) details.push(`${newAccountsCount} accounts`);
      if (newVendorsCount > 0) details.push(`${newVendorsCount} vendors`);
      if (newCategoriesCount > 0)
        details.push(`${newCategoriesCount} categories`);
      if (newSubCategoriesCount > 0)
        details.push(`${newSubCategoriesCount} sub-categories`);

      if (details.length > 0) {
        desc += ` Added ${details.join(", ")}.`;
      }

      if (skippedCount > 0) {
        desc += ` Skipped ${skippedCount} invalid rows.`;
      }

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

      setOperationProgress({
        title: "Import Complete",
        description: "All done!",
        stage: "Stage 4/4: Complete",
        progress: 100,
        totalStages: 4,
      });
    } catch (error: any) {
      setOperationProgress(null);
      toast({
        title: "Error importing transactions",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMappingConfirm = (data: ImportRow[], config: ImportConfig) => {
    processImport(data, config);
    setMappingDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDetectTransfers = async () => {
    const count = await detectAndLinkTransfers();
    if (count > 0) {
      showSuccess(`Successfully linked ${count} transfer pairs.`);
    } else {
      toast({
        title: "No transfers detected",
        description:
          "Checked all uncategorized transactions for matching pairs.",
      });
    }
  };

  return {
    handleExport,
    handleImportClick,
    handleFileChange,
    fileInputRef,
    processImport,
    mappingDialogState,
    setMappingDialogState,
    handleMappingConfirm,
    handleDetectTransfers,
  };
};
