"use client";

import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import TransactionTable from "@/components/transactions/TransactionTable";
import AddEditTransactionDialog from "@/components/dialogs/AddEditTransactionDialog";
import CSVMappingDialog from "@/components/transactions/CSVMappingDialog";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useLedger } from "@/contexts/LedgerContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { SearchFilterBar } from "@/components/filters/SearchFilterBar";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
// import { useDefaultAccountSelection } from "@/hooks/useDefaultAccountSelection";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";

import { slugify } from "@/lib/utils";
import { AddEditScheduledTransactionDialog } from "@/components/scheduled-transactions/AddEditScheduledTransactionDialog";
import { projectScheduledTransactions } from "@/utils/forecasting";
import { addMonths } from "date-fns";
import { Transaction } from "@/data/finance-data";
import { ScheduledTransaction } from "@/types/dataProvider";
import { TransactionPageHeader } from "@/components/transactions/TransactionPageHeader";
import { useTransactionPageActions } from "@/hooks/transactions/useTransactionPageActions";
import { MissingCurrencyDialog } from "@/components/dialogs/MissingCurrencyDialog";
import { useAutoCategorize } from "@/hooks/useAutoCategorize";
import { useAIConfig } from "@/hooks/useAIConfig";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Transactions = () => {
  //   const session = useSession();
  const {
    transactions: allTransactions,
    scheduledTransactions,
    isLoadingTransactions,
    deleteMultipleTransactions,
    invalidateAllData,
    addTransaction,
    accounts,
    vendors,
    categories,
    subCategories,
    unlinkTransaction,
    linkTransactions,
    accountCurrencyMap,
    cleanUpDuplicates,
    updateTransaction,
    setOperationProgress,
  } = useTransactions();
  const { activeLedger } = useLedger();
  const { autoCategorizeBulk, getHistoricalMapping } = useAutoCategorize();
  const { config } = useAIConfig();

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
    transactionType,
    setSelectedCategories,
    setSelectedSubCategories,
    setSelectedAccounts,
    setSelectedVendors,
    setDateRange,
  } = useTransactionFilters();

  const location = useLocation();

  React.useEffect(() => {
    if (location.state) {
      const state = location.state as {
        filterCategory?: string;
        filterSubCategory?: string;
        filterVendor?: string;
        filterAccount?: string;
        dateRange?: { from: string | Date; to: string | Date };
      };

      if (
        state.filterCategory ||
        state.filterSubCategory ||
        state.filterVendor ||
        state.filterAccount
      ) {
        if (state.filterCategory) {
          setSelectedCategories([slugify(state.filterCategory)]);
          setSelectedVendors([]);
          if (!state.filterSubCategory) {
            setSelectedSubCategories([]);
          }
          setSelectedAccounts([]);
        }

        if (state.filterSubCategory) {
          setSelectedSubCategories([slugify(state.filterSubCategory)]);
        }

        if (state.filterVendor) {
          setSelectedVendors([slugify(state.filterVendor)]);
          setSelectedCategories([]);
          setSelectedSubCategories([]);
          setSelectedAccounts([]);
        }

        if (state.filterAccount) {
          setSelectedAccounts([slugify(state.filterAccount)]);
          setSelectedCategories([]);
          setSelectedSubCategories([]);
          setSelectedVendors([]);
        }
      }

      if (state.dateRange) {
        setDateRange({
          from: new Date(state.dateRange.from),
          to: new Date(state.dateRange.to),
        });
      }

      window.history.replaceState({}, document.title);
    }
  }, [
    location.state,
    setSelectedAccounts,
    setSelectedCategories,
    setSelectedSubCategories,
    setSelectedVendors,
    setDateRange,
  ]);

  const dataProvider = useDataProvider();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [isScheduledDialogOpen, setIsScheduledDialogOpen] = useState(false);
  const [scheduledTransactionToEdit, setScheduledTransactionToEdit] =
    useState<ScheduledTransaction | null>(null);
  const [selectedTransactionForSchedule, setSelectedTransactionForSchedule] =
    useState<ScheduledTransaction | null>(null);

  const [isCleanupConfirmOpen, setIsCleanupConfirmOpen] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const [isBulkCategorizing, setIsBulkCategorizing] = useState(false);

  const { toast } = useToast();

  const projectedTransactions = React.useMemo(() => {
    if (scheduledTransactions.length > 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() + 1);

      let end: Date;
      if (dateRange?.to) {
        end = new Date(dateRange.to);
      } else {
        end = addMonths(today, 6);
      }

      return projectScheduledTransactions(scheduledTransactions, start, end);
    }
    return [];
  }, [scheduledTransactions, dateRange?.to]);

  const combinedTransactions = React.useMemo(
    () => [...allTransactions, ...projectedTransactions],
    [allTransactions, projectedTransactions],
  );

  const filteredTransactions = React.useMemo(() => {
    let result = combinedTransactions.filter((t) => {
      if (dateRange?.from) {
        const tDate = new Date(t.date);
        if (tDate < dateRange.from) return false;
        if (dateRange.to) {
          const endDate = new Date(dateRange.to);
          endDate.setHours(23, 59, 59, 999);
          if (tDate > endDate) return false;
        }
      }

      if (
        selectedAccounts.length > 0 &&
        !selectedAccounts.includes(slugify(t.account))
      )
        return false;
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(slugify(t.category))
      )
        return false;
      if (
        selectedSubCategories.length > 0 &&
        !selectedSubCategories.includes(slugify(t.sub_category || ""))
      )
        return false;
      if (
        selectedVendors.length > 0 &&
        !selectedVendors.includes(slugify(t.vendor))
      )
        return false;

      if (excludeTransfers && (t.category === "Transfer" || !!t.transfer_id))
        return false;

      if (minAmount !== undefined && Math.abs(t.amount) < minAmount)
        return false;
      if (maxAmount !== undefined && Math.abs(t.amount) > maxAmount)
        return false;

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

      if (transactionType === "expense") {
        if (t.amount > 0) return false;
      } else if (transactionType === "income") {
        if (t.amount < 0) return false;
      }

      return true;
    });

    if (sortOrder === "largest") {
      result.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    } else if (sortOrder === "smallest") {
      result.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    } else {
      result.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }

    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [
    combinedTransactions,
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
    transactionType,
  ]);

  // Memoized handlers to prevent unnecessary re-renders of TransactionTable/TransactionRow
  const handleDeleteTransactionsWrapper = React.useCallback(
    async (
      items: {
        id: string;
        transfer_id?: string;
        is_projected?: boolean;
        recurrence_id?: string;
        date?: string;
      }[],
    ) => {
      // Simplified Logic: Directly delete without prompting.
      // Real transactions are deleted. Projected transactions are 'skipped'.
      const extendedItems = items.map((i) => {
        // Find full object to carry extra metadata if needed (like recurrence_id for projected items)
        // Actually, filteredTransactions should have it.
        const full = filteredTransactions.find((t) => t.id === i.id);
        return full
          ? {
              ...i,
              ...full,
              transfer_id: full.transfer_id || undefined,
              recurrence_id: full.recurrence_id || undefined,
            }
          : i;
      });

      await deleteMultipleTransactions(extendedItems);
    },
    [filteredTransactions, deleteMultipleTransactions],
  );
  // Removed handleConfirmDelete and related dialogs.

  const handleScheduleTransactions = (
    selectedTransactions: Transaction[],
    clearSelection: () => void,
  ) => {
    if (selectedTransactions.length === 0) return;

    const transaction = selectedTransactions[0];

    if (selectedTransactions.length === 1 && transaction.recurrence_id) {
      const existingSchedule = scheduledTransactions.find(
        (s) => s.id === transaction.recurrence_id,
      );
      if (existingSchedule) {
        setScheduledTransactionToEdit(existingSchedule);
        setSelectedTransactionForSchedule(null);
        setIsScheduledDialogOpen(true);
        clearSelection();
        return;
      } else {
        toast({
          title: "Schedule Not Found",
          description: "The original schedule seems to have been deleted.",
          variant: "destructive",
        });
      }
    }

    setScheduledTransactionToEdit(null);
    setSelectedTransactionForSchedule({
      ...transaction,
      frequency: "Monthly",
      id: "",
      date: new Date().toISOString(),
    } as unknown as ScheduledTransaction);
    setIsScheduledDialogOpen(true);
    clearSelection();
  };

  const REQUIRED_HEADERS = [
    "Date",
    "Account",
    "Payee",
    "Category",
    "Subcategory",
    "Currency",
    "Amount",
    "Notes",
    "Frequency",
    "End Date",
    "Transfer ID",
    "Account Type",
    "Transfer Account",
    "Transfer Amount",
  ];

  const {
    handleExport,
    handleImportClick,
    handleFileChange,
    fileInputRef,
    mappingDialogState,
    setMappingDialogState,
    handleMappingConfirm,
    handleDetectTransfers,
    missingCurrencyAccounts,
    resolveMissingCurrencies,
  } = useTransactionPageActions(filteredTransactions);

  const handleCleanupDuplicates = async () => {
    setIsCleaningUp(true);
    try {
      const count = await cleanUpDuplicates();
      if (count > 0) {
        toast({
          title: "Cleanup Complete",
          description: `Removed ${count} duplicate transactions.`,
        });
        invalidateAllData();
      } else {
        toast({
          title: "No Duplicates",
          description: "No duplicate transactions were found.",
        });
      }
    } catch (_error) {
      toast({
        title: "Cleanup Failed",
        description: "An error occurred while removing duplicates.",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
      setIsCleanupConfirmOpen(false);
    }
  };

  const handleBulkCategorize = async () => {
    try {
      const uncategorizedItems = allTransactions.filter(
        (t) =>
          !t.category ||
          t.category.toLowerCase() === "uncategorized" ||
          t.category.trim() === "",
      );

      const allUniqueVendors = Array.from(
        new Set(
          uncategorizedItems.map((t) => t.vendor?.trim()).filter(Boolean),
        ),
      );

      if (allUniqueVendors.length === 0) {
        toast({
          title: "Nothing to categorize",
          description: "No uncategorized vendors found.",
        });
        return;
      }

      // Check for config before starting progress modal
      if (!config.apiKey || config.provider === "NONE") {
        toast({
          title: "AI Not Configured",
          description: (
            <div className="flex flex-col gap-2">
              <span>Please configure your AI provider and API key first.</span>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-fit mt-1"
              >
                <Link to="/settings">Go to AI Settings</Link>
              </Button>
            </div>
          ),
          variant: "destructive",
        });
        return;
      }

      const localMappings: Record<string, any> = {};
      const unknownVendors: string[] = [];

      const sortedHistory = [...allTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      for (const vendor of allUniqueVendors) {
        if (!vendor) continue;
        const cached = getHistoricalMapping(vendor, sortedHistory);
        if (cached) {
          localMappings[vendor] = cached;
        } else {
          unknownVendors.push(vendor);
        }
      }

      let aiMappings: Record<string, any> = {};

      if (unknownVendors.length > 0) {
        setIsBulkCategorizing(true);
        setOperationProgress({
          title: "Auto-Categorizing",
          description: `Categorizing ${allUniqueVendors.length} unique vendors (${
            Object.keys(localMappings).length ? "Some locally matched" : ""
          })...`,
          stage: "Calling AI",
          progress: 50,
          totalStages: 100,
        });

        try {
          aiMappings = await autoCategorizeBulk(
            unknownVendors,
            categories,
            subCategories,
          );
        } catch (e) {
          if (Object.keys(localMappings).length === 0) {
            throw e;
          }
          // If we have some local mappings, we ignore the AI error and let it proceed
        }
      } else {
        setIsBulkCategorizing(true);
        setOperationProgress({
          title: "Auto-Categorizing locally",
          description: `Matched ${allUniqueVendors.length} vendors from your history!`,
          stage: "Applying updates",
          progress: 90,
          totalStages: 100,
        });
      }

      const combinedMappings = { ...localMappings, ...aiMappings };
      const updates = [];

      for (const t of uncategorizedItems) {
        if (!t.vendor) continue;
        const vendorKey = Object.keys(combinedMappings).find(
          (k) => k.toLowerCase() === t.vendor.toLowerCase(),
        );
        const suggestion = vendorKey ? combinedMappings[vendorKey] : null;

        if (suggestion && suggestion.categoryName) {
          updates.push({
            ...t,
            category: suggestion.categoryName,
            sub_category: suggestion.subCategoryName || t.sub_category,
          });
        }
      }

      if (updates.length > 0) {
        for (let i = 0; i < updates.length; i++) {
          await updateTransaction(updates[i]);
        }
        toast({
          title: "Bulk Categorization",
          description: `Categorized ${updates.length} transactions successfully.`,
        });
        invalidateAllData();
      } else {
        toast({
          title: "No changes",
          description:
            "The AI could not confidently categorize any items or no valid mappings were returned.",
        });
      }
    } catch (e) {
      console.error("Bulk categorization error:", e);
      const errorMessage =
        e instanceof Error ? e.message : "Bulk categorization failed";

      const errorStr = String(errorMessage || "");

      toast({
        title: "Categorization Failed",
        description: (
          <div className="flex flex-col gap-2">
            <span>{errorStr}</span>
            {(errorStr.includes("configured") ||
              errorStr.includes("API Key")) && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-fit mt-1"
              >
                <Link to="/settings">Go to AI Settings</Link>
              </Button>
            )}
          </div>
        ),
        variant: "destructive",
      });
    } finally {
      setOperationProgress(null);
      setIsBulkCategorizing(false);
    }
  };

  const handleUnlinkTransaction = React.useCallback(
    async (transferId: string) => {
      console.log("handleUnlinkTransaction called with:", transferId);
      const confirm = window.confirm(
        "Are you sure you want to unlink these transactions?",
      );
      if (confirm) {
        await unlinkTransaction(transferId);
        toast({
          title: "Transactions Unlinked",
          description: "The transfer link has been removed.",
        });
      }
    },
    [unlinkTransaction, toast],
  );

  const handleLinkTransactions = React.useCallback(
    async (id1: string, id2: string) => {
      await linkTransactions(id1, id2);
      toast({
        title: "Transactions Linked",
        description: "The transactions have been paired as a transfer.",
      });
    },
    [linkTransactions, toast],
  );

  const handleRowDoubleClick = React.useCallback(
    (transaction: Transaction) => {
      setEditingTransaction(transaction);
      setIsDialogOpen(true);
    },
    [setEditingTransaction, setIsDialogOpen],
  );

  return (
    <div className="page-container">
      <div className="flex flex-col gap-6 mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        <TransactionPageHeader
          onImportClick={handleImportClick}
          onExportClick={handleExport}
          onDetectTransfers={handleDetectTransfers}
          onAddTransaction={() => {
            setEditingTransaction(null);
            setIsDialogOpen(true);
          }}
          onCleanUpDuplicates={() => setIsCleanupConfirmOpen(true)}
          onBulkCategorize={handleBulkCategorize}
          isBulkCategorizeEnabled={!isBulkCategorizing}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
        />

        <SearchFilterBar />
      </div>

      <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <TransactionTable
          transactions={filteredTransactions}
          allData={combinedTransactions}
          loading={isLoadingTransactions}
          onRefresh={invalidateAllData}
          onDeleteTransactions={handleDeleteTransactionsWrapper}
          onAddTransaction={addTransaction}
          onScheduleTransactions={handleScheduleTransactions}
          onUnlinkTransaction={handleUnlinkTransaction}
          onLinkTransactions={handleLinkTransactions}
          onRowDoubleClick={handleRowDoubleClick}
          accountCurrencyMap={accountCurrencyMap}
        />
      </div>

      <AddEditTransactionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={(accountName) => {
          if (accountName && selectedAccounts.length > 0) {
            const slugifiedAccount = slugify(accountName);
            if (!selectedAccounts.includes(slugifiedAccount)) {
              setSelectedAccounts((prev) => {
                if (prev.includes(slugifiedAccount)) return prev;
                return [...prev, slugifiedAccount];
              });
              toast({
                title: "Filter Updated",
                description: `Added "${accountName}" to your view so you can see the new transaction.`,
              });
            }
          }
          // Invalidate data AFTER updating filters to avoid race condition with default account selection
          invalidateAllData();
        }}
        transactionToEdit={editingTransaction}
      />

      <AddEditScheduledTransactionDialog
        isOpen={isScheduledDialogOpen}
        onOpenChange={setIsScheduledDialogOpen}
        transaction={
          scheduledTransactionToEdit || selectedTransactionForSchedule
        }
        onSubmit={async (values) => {
          try {
            const isEdit = !!scheduledTransactionToEdit?.id;
            const payload = {
              ...values,
              user_id: activeLedger?.id || "local-user",
            };

            if (isEdit) {
              await dataProvider.updateScheduledTransaction({
                ...scheduledTransactionToEdit,
                ...payload,
              });
              toast({
                title: "Schedule Updated",
                description: "The recurring transaction has been updated.",
              });
            } else {
              await dataProvider.addScheduledTransaction(payload);
              toast({
                title: "Schedule Created",
                description: "A new recurring transaction has been scheduled.",
              });
            }
            setIsScheduledDialogOpen(false);
            invalidateAllData();
          } catch (e) {
            console.error(e);
            toast({
              title: "Error",
              description: "Failed to save schedule.",
              variant: "destructive",
            });
          }
        }}
        isSubmitting={false}
        isLoading={false}
        accounts={accounts || []}
        categories={categories || []}
        allSubCategories={subCategories?.map((s) => s.name) || []}
        allPayees={[
          ...(accounts || []).map((a) => ({
            value: a.name,
            label: a.name,
            isAccount: true,
          })),
          ...(vendors || []).map((v) => ({
            value: v.name,
            label: v.name,
            isAccount: false,
          })),
        ]}
      />

      <CSVMappingDialog
        isOpen={mappingDialogState.isOpen}
        onClose={() =>
          setMappingDialogState((prev) => ({ ...prev, isOpen: false }))
        }
        file={mappingDialogState.file}
        requiredHeaders={REQUIRED_HEADERS}
        onConfirm={handleMappingConfirm}
      />

      <MissingCurrencyDialog
        isOpen={missingCurrencyAccounts.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            // If user closes dialog without confirming, we should probably abort import or let them cancel
            // But the hook resets state on finish/error.
            // We don't have a direct cancel method exposed yet, but closing dialog essentially pauses it indefinitely unless we clear state.
            // We should probably just do nothing or reload page.
            // Ideally we add a cancelImport to the hook but for now let's just let it stay or close.
            // Actually the dialog has a cancel button which should clear the state.
          }
        }}
        accounts={missingCurrencyAccounts}
        onConfirm={resolveMissingCurrencies}
        onCancel={() => window.location.reload()} // Simple way to abort for now or we can expose a reset function
      />

      <ConfirmationDialog
        isOpen={isCleanupConfirmOpen}
        onOpenChange={setIsCleanupConfirmOpen}
        onConfirm={handleCleanupDuplicates}
        title="Remove Duplicate Transactions?"
        description="This will scan for transactions with identical recurrence IDs on the same date and remove the duplicates. This action cannot be undone."
        confirmText={isCleaningUp ? "Cleaning..." : "Remove Duplicates"}
      />
    </div>
  );
};

export default Transactions;
