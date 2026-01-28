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

import { slugify } from "@/lib/utils";
import { AddEditScheduledTransactionDialog } from "@/components/scheduled-transactions/AddEditScheduledTransactionDialog";
import { projectScheduledTransactions } from "@/utils/forecasting";
import { addMonths } from "date-fns";
import { TransactionPageHeader } from "@/components/transactions/TransactionPageHeader";
import { useTransactionPageActions } from "@/hooks/transactions/useTransactionPageActions";

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
  } = useTransactions();
  const { activeLedger } = useLedger();

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
  } = useTransactionFilters();

  const location = useLocation();

  // useDefaultAccountSelection hook call removed (handled in Layout.tsx)

  React.useEffect(() => {
    if (location.state) {
      const state = location.state as {
        filterCategory?: string;
        filterSubCategory?: string;
        filterVendor?: string;
        filterAccount?: string;
      };

      if (state.filterCategory || state.filterSubCategory || state.filterVendor || state.filterAccount) {
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
      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

  const dataProvider = useDataProvider();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const [isScheduledDialogOpen, setIsScheduledDialogOpen] = useState(false);
  const [scheduledTransactionToEdit, setScheduledTransactionToEdit] = useState<any>(null);
  const [selectedTransactionForSchedule, setSelectedTransactionForSchedule] = useState<any>(null);



  const { toast } = useToast();

  const filteredTransactions = React.useMemo(() => {
    let projected: any[] = [];
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

      projected = projectScheduledTransactions(scheduledTransactions, start, end);
    }

    const combinedTransactions = [...allTransactions, ...projected];

    let result = combinedTransactions.filter(t => {
      if (dateRange?.from) {
        const tDate = new Date(t.date);
        if (tDate < dateRange.from) return false;
        if (dateRange.to) {
          const endDate = new Date(dateRange.to);
          endDate.setHours(23, 59, 59, 999);
          if (tDate > endDate) return false;
        }
      }

      if (selectedAccounts.length > 0 && !selectedAccounts.includes(slugify(t.account))) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(slugify(t.category))) return false;
      if (selectedSubCategories.length > 0 && !selectedSubCategories.includes(slugify(t.sub_category || ''))) return false;
      if (selectedVendors.length > 0 && !selectedVendors.includes(slugify(t.vendor))) return false;

      if (excludeTransfers && (t.category === 'Transfer' || !!t.transfer_id)) return false;

      if (minAmount !== undefined && Math.abs(t.amount) < minAmount) return false;
      if (maxAmount !== undefined && Math.abs(t.amount) > maxAmount) return false;

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

      if (transactionType === 'expense') {
        if (t.amount > 0) return false;
      } else if (transactionType === 'income') {
        if (t.amount < 0) return false;
      }

      return true;
    });

    if (sortOrder === 'largest') {
      result.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    } else if (sortOrder === 'smallest') {
      result.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    } else {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [allTransactions, scheduledTransactions, selectedAccounts, selectedCategories, selectedSubCategories, selectedVendors, dateRange, excludeTransfers, minAmount, maxAmount, searchTerm, limit, sortOrder, transactionType]);

  const handleDeleteTransactionsWrapper = async (items: { id: string, transfer_id?: string, is_projected?: boolean, recurrence_id?: string, date?: string }[]) => {
    // Simplified Logic: Directly delete without prompting.
    // Real transactions are deleted. Projected transactions are 'skipped'.
    const extendedItems = items.map(i => {
      // Find full object to carry extra metadata if needed (like recurrence_id for projected items)
      // Actually, filteredTransactions should have it.
      const full = filteredTransactions.find(t => t.id === i.id);
      return full ? { ...i, ...full } : i;
    });

    await deleteMultipleTransactions(extendedItems);
  };
  // Removed handleConfirmDelete and related dialogs.

  const handleScheduleTransactions = (selectedTransactions: any[], clearSelection: () => void) => {
    if (selectedTransactions.length === 0) return;

    const transaction = selectedTransactions[0];

    if (selectedTransactions.length === 1 && transaction.recurrence_id) {
      const existingSchedule = scheduledTransactions.find(s => s.id === transaction.recurrence_id);
      if (existingSchedule) {
        setScheduledTransactionToEdit(existingSchedule);
        setSelectedTransactionForSchedule(null);
        setIsScheduledDialogOpen(true);
        clearSelection();
        return;
      } else {
        toast({ title: "Schedule Not Found", description: "The original schedule seems to have been deleted.", variant: "destructive" });
      }
    }

    setScheduledTransactionToEdit(null);
    setSelectedTransactionForSchedule({
      ...transaction,
      frequency: 'Monthly',
      id: undefined,
      date: new Date().toISOString()
    });
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
    "Account Type"
  ];

  const {
    handleExport,
    handleImportClick,
    handleFileChange,
    fileInputRef,
    mappingDialogState,
    setMappingDialogState,
    handleMappingConfirm,
    handleDetectTransfers
  } = useTransactionPageActions(filteredTransactions);

  return (
    <div className="space-y-6 p-6 rounded-xl min-h-[calc(100vh-100px)] transition-all duration-500 bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="flex flex-col gap-6 mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        <TransactionPageHeader
          onImportClick={handleImportClick}
          onExportClick={handleExport}
          onDetectTransfers={handleDetectTransfers}
          onAddTransaction={() => { setEditingTransaction(null); setIsDialogOpen(true); }}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
        />

        <SearchFilterBar />
      </div>

      <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <TransactionTable
          transactions={filteredTransactions}
          loading={isLoadingTransactions}
          onRefresh={invalidateAllData}
          onDeleteTransactions={handleDeleteTransactionsWrapper}
          onAddTransaction={addTransaction}
          onScheduleTransactions={handleScheduleTransactions}
          onUnlinkTransaction={async (transferId) => {
            const confirm = window.confirm("Are you sure you want to unlink these transactions?");
            if (confirm) {
              await unlinkTransaction(transferId);
              toast({ title: "Transactions Unlinked", description: "The transfer link has been removed." });
            }
          }}
          onLinkTransactions={async (id1, id2) => {
            await linkTransactions(id1, id2);
            toast({ title: "Transactions Linked", description: "The transactions have been paired as a transfer." });
          }}
          onRowDoubleClick={(transaction) => {
            setEditingTransaction(transaction);
            setEditingTransaction(transaction);
            setIsDialogOpen(true);
          }}
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
              setSelectedAccounts(prev => {
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
        transaction={scheduledTransactionToEdit || selectedTransactionForSchedule}
        onSubmit={async (values) => {
          try {
            const isEdit = !!scheduledTransactionToEdit?.id;
            const payload = {
              ...values,
              user_id: activeLedger?.id || 'local-user',
            };

            if (isEdit) {
              await dataProvider.updateScheduledTransaction({ ...scheduledTransactionToEdit, ...payload });
              toast({ title: "Schedule Updated", description: "The recurring transaction has been updated." });
            } else {
              await dataProvider.addScheduledTransaction(payload);
              toast({ title: "Schedule Created", description: "A new recurring transaction has been scheduled." });
            }
            setIsScheduledDialogOpen(false);
            invalidateAllData();
          } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to save schedule.", variant: "destructive" });
          }
        }}
        isSubmitting={false}
        isLoading={false}
        accounts={accounts || []}
        categories={categories || []}
        allSubCategories={subCategories?.map(s => s.name) || []}
        allPayees={[
          ...(accounts || []).map(a => ({ value: a.name, label: a.name, isAccount: true })),
          ...(vendors || []).map(v => ({ value: v.name, label: v.name, isAccount: false }))
        ]}
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