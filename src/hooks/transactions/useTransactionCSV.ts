import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useUser } from "@/contexts/UserContext";
import { showError, showSuccess } from "@/utils/toast";
import { formatDateToDDMMYYYY, parseDateFromDDMMYYYY } from "@/lib/utils";
import Papa from "papaparse";
import { useDataProvider } from "@/context/DataProviderContext";

export const useTransactionCSV = () => {
  const {
    transactions,
    refetchTransactions,
    refetchVendors,
    refetchAccounts,
    accountCurrencyMap,
    detectAndLinkTransfers,
    setOperationProgress
  } = useTransactions();
  const { user } = useUser();
  const dataProvider = useDataProvider();

  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!user?.id) {
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
        const requiredHeaders = ["Date", "Account", "Vendor", "Category", "Amount", "Remarks", "Currency", "Frequency", "End Date"];
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
          const totalSteps = 4;
          setOperationProgress({
            title: "Importing CSV",
            description: "Preparing to import transactions...",
            stage: "Analyzing Accounts & Payees...",
            progress: 10,
            totalStages: totalSteps
          });

          // Step 1: Ensure all payees exist
          const uniqueAccountsData = parsedData.map(row => ({
            name: row.Account,
            currency: row.Currency,
          })).filter(item => item.name);

          await Promise.all(uniqueAccountsData.map(async (acc) => {
            await dataProvider.ensurePayeeExists(acc.name, true, { currency: acc.currency, startingBalance: 0 });
          }));

          const uniqueVendors = [...new Set(parsedData.map(row => row.Vendor).filter(Boolean))];
          await Promise.all(uniqueVendors.map(name => {
            const row = parsedData.find(r => r.Vendor === name);
            const isTransfer = row?.Category === 'Transfer';
            return dataProvider.ensurePayeeExists(name, isTransfer);
          }));

          setOperationProgress({
            title: "Importing CSV",
            description: "Checking categories...",
            stage: "Verifying Categories...",
            progress: 25,
            totalStages: totalSteps
          });

          // Step 2: Ensure all categories exist
          const uniqueCategories = [...new Set(parsedData.map(row => row.Category).filter(Boolean))];
          await Promise.all(uniqueCategories.map(name => dataProvider.ensureCategoryExists(name, user.id)));

          await Promise.all([refetchVendors(), refetchAccounts()]);

          // Step 3: Prepare transactions for insertion using the now-updated accountCurrencyMap
          const transactionsToInsert = parsedData.map(row => {
            const accountCurrency = accountCurrencyMap.get(row.Account) || row.Currency || 'USD';
            if (!accountCurrency) {
              console.warn(`Could not determine currency for account: ${row.Account}. Skipping row.`);
              return null;
            }

            // Parse frequency and end date
            let recurrenceId: string | null = null;
            let recurrenceFrequency: string | null = null;
            let recurrenceEndDate: string | null = null;

            if (row.Frequency && row.Frequency !== 'None') {
              recurrenceId = `recurrence_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
              recurrenceFrequency = row.Frequency;
              recurrenceEndDate = row["End Date"] ? parseDateFromDDMMYYYY(row["End Date"]).toISOString() : null;
            }

            return {
              user_id: user.id, // Required by type
              date: parseDateFromDDMMYYYY(row.Date).toISOString(),
              account: row.Account,
              vendor: row.Vendor,
              category: row.Category,
              amount: parseFloat(row.Amount) || 0,
              remarks: row.Remarks,
              currency: accountCurrency,
              transfer_id: row.transfer_id || null,
              is_scheduled_origin: false,
              recurrence_id: recurrenceId,
              recurrence_frequency: recurrenceFrequency,
              recurrence_end_date: recurrenceEndDate,
            };
          }).filter((t): t is NonNullable<typeof t> => t !== null);

          if (transactionsToInsert.length === 0) {
            showError("No valid transactions could be prepared from the CSV. Check account names, amounts, and currency column.");
            setIsImporting(false);
            setOperationProgress(null);
            return;
          }

          setOperationProgress({
            title: "Importing CSV",
            description: `Importing ${transactionsToInsert.length} transactions...`,
            stage: "Saving Transactions...",
            progress: 50,
            totalStages: totalSteps
          });

          // Step 4: Insert transactions
          // Loop insertion
          let insertedCount = 0;
          for (const t of transactionsToInsert) {
            await dataProvider.addTransaction(t);
            insertedCount++;
            // Update progress occasionally
            if (insertedCount % 10 === 0) {
              setOperationProgress({
                title: "Importing CSV",
                description: `Importing... (${insertedCount}/${transactionsToInsert.length})`,
                stage: "Saving Transactions...",
                progress: 50 + Math.floor((insertedCount / transactionsToInsert.length) * 30), // Map to 50-80%
                totalStages: totalSteps
              });
            }
          }

          setOperationProgress({
            title: "Importing CSV",
            description: "Linking transfers...",
            stage: "Detecting Transfers...",
            progress: 90,
            totalStages: totalSteps
          });

          showSuccess(`${transactionsToInsert.length} transactions imported successfully!`);

          // Auto-detect transfers in the background
          const linkedCount = await detectAndLinkTransfers();
          if (linkedCount > 0) {
            showSuccess(`Automatically identified and linked ${linkedCount} transfer pairs.`);
          }

          setOperationProgress({
            title: "Importing CSV",
            description: "All done!",
            stage: "Complete",
            progress: 100,
            totalStages: totalSteps
          });

          refetchTransactions();
        } catch (error: any) {
          showError(`Import failed: ${error.message}`);
          setOperationProgress(null);
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          // Dialog closes automatically on 100% or we can ensure it's closed in case of error
        }
      },
      error: (error: any) => {
        showError(`CSV parsing error: ${error.message}`);
        setIsImporting(false);
      },
    });
  }, [user, refetchTransactions, refetchVendors, refetchAccounts, accountCurrencyMap]);

  const handleExportClick = React.useCallback(() => {
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
      "is_scheduled_origin": t.is_scheduled_origin || false,
      "Frequency": t.recurrence_frequency || "None",
      "End Date": t.recurrence_end_date ? formatDateToDDMMYYYY(t.recurrence_end_date) : "",
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
  }, [transactions]);

  return {
    isImporting,
    fileInputRef,
    handleImportClick,
    handleFileChange,
    handleExportClick,
  };
};