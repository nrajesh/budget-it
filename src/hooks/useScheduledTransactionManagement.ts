import * as React from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from "@/contexts/UserContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { ScheduledTransaction as ScheduledTransactionType, createScheduledTransactionsService } from '@/services/scheduledTransactionsService';
import { ensurePayeeExists, ensureCategoryExists } from "@/integrations/supabase/utils";
import Papa from "papaparse";
import { parseDateFromDDMMYYYY } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export const useScheduledTransactionManagement = () => {
  const { user, isLoadingUser } = useUser();
  const { accounts, vendors, categories, isLoadingAccounts, isLoadingVendors, isLoadingCategories, refetchTransactions: refetchMainTransactions } = useTransactions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [transactionToDelete, setTransactionToDelete] = React.useState<ScheduledTransactionType | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<ScheduledTransactionType | null>(null);

  const allPayees = React.useMemo(() => {
    return [
      ...accounts.map(p => ({ value: p.name, label: p.name, isAccount: true })),
      ...vendors.map(p => ({ value: p.name, label: p.name, isAccount: false }))
    ].sort((a, b) => a.label.localeCompare(b.label));
  }, [accounts, vendors]);

  const { fetchScheduledTransactions } = createScheduledTransactionsService({
    refetchTransactions: refetchMainTransactions,
    userId: user?.id,
  });

  const { data: scheduledTransactions = [], isLoading: isLoadingScheduled, refetch } = useQuery<ScheduledTransactionType[], Error>({
    queryKey: ['scheduledTransactions', user?.id],
    queryFn: fetchScheduledTransactions,
    enabled: !!user?.id && !isLoadingUser,
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) throw new Error("User not logged in.");
      const { error } = await supabase.from('scheduled_transactions').delete().in('id', ids).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      showSuccess(transactionToDelete ? "Transaction deleted." : `${selectedRows.length} transactions deleted.`);
      await refetch();
      setIsConfirmOpen(false);
      setTransactionToDelete(null);
      setSelectedRows([]);
    },
    onError: (error: any) => showError(`Delete failed: ${error.message}`),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error("User not logged in.");
      const isVendorAnAccount = allPayees.find(p => p.value === data.vendor)?.isAccount || false;
      await ensurePayeeExists(data.account, true);
      await ensurePayeeExists(data.vendor, isVendorAnAccount);
      if (data.category !== 'Transfer') await ensureCategoryExists(data.category, user.id);

      const dbPayload = {
        date: new Date(data.date).toISOString(),
        account: data.account,
        vendor: data.vendor,
        category: data.category,
        amount: data.amount,
        remarks: data.remarks || null,
        frequency: `${data.frequency_value}${data.frequency_unit}`,
        last_processed_date: new Date(data.date).toISOString(),
        recurrence_end_date: data.recurrence_end_date ? new Date(data.recurrence_end_date).toISOString() : null,
      };

      if (editingTransaction) {
        const { error } = await supabase.from('scheduled_transactions').update(dbPayload).eq('id', editingTransaction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('scheduled_transactions').insert({ ...dbPayload, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      showSuccess(editingTransaction ? "Transaction updated." : "Transaction added.");
      await refetch();
      setIsFormOpen(false);
    },
    onError: (error: any) => showError(`Save failed: ${error.message}`),
  });

  const batchUpsertMutation = useMutation({
    mutationFn: async (transactionsToInsert: any[]) => {
      const { error } = await supabase.from('scheduled_transactions').insert(transactionsToInsert);
      if (error) throw error;
    },
    onSuccess: async (data, variables) => {
      showSuccess(`${variables.length} transactions imported.`);
      await refetch();
    },
    onError: (error: any) => showError(`Import failed: ${error.message}`),
    onSettled: () => setIsImporting(false),
  });

  const handleAddClick = () => { setEditingTransaction(null); setIsFormOpen(true); };
  const handleEditClick = (t: ScheduledTransactionType) => { setEditingTransaction(t); setIsFormOpen(true); };
  const handleDeleteClick = (t: ScheduledTransactionType) => { setTransactionToDelete(t); setIsConfirmOpen(true); };
  const confirmDelete = () => { const ids = transactionToDelete ? [transactionToDelete.id] : selectedRows; deleteMutation.mutate(ids); };
  const handleSelectAll = (checked: boolean, currentItems: ScheduledTransactionType[]) => setSelectedRows(checked ? currentItems.map(t => t.id) : []);
  const handleRowSelect = (id: string, checked: boolean) => setSelectedRows(prev => checked ? [...prev, id] : prev.filter(rowId => rowId !== id));
  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const requiredHeaders = ["Date", "Account", "Vendor", "Category", "Amount", "Frequency", "Remarks", "End Date"];
          if (!requiredHeaders.every(h => results.meta.fields?.includes(h))) throw new Error("CSV is missing required headers.");
          const parsedData = results.data as any[];
          if (parsedData.length === 0) throw new Error("No data found in CSV.");

          const uniqueAccounts = [...new Set(parsedData.map(r => r.Account))];
          await Promise.all(uniqueAccounts.map(name => ensurePayeeExists(name, true)));
          const uniqueVendors = [...new Set(parsedData.map(r => r.Vendor))];
          await Promise.all(uniqueVendors.map(name => ensurePayeeExists(name, parsedData.find(r => r.Vendor === name)?.Category === 'Transfer')));
          const uniqueCategories = [...new Set(parsedData.map(r => r.Category))];
          await Promise.all(uniqueCategories.map(name => ensureCategoryExists(name, user.id)));

          const today = new Date(); today.setHours(0, 0, 0, 0);
          const transactionsToInsert = parsedData.map(row => {
            const parsedDate = parseDateFromDDMMYYYY(row.Date);
            parsedDate.setHours(0, 0, 0, 0);
            return {
              date: parsedDate.toISOString(),
              account: row.Account, vendor: row.Vendor, category: row.Category,
              amount: parseFloat(row.Amount) || 0, frequency: row.Frequency, remarks: row.Remarks || null,
              user_id: user.id,
              last_processed_date: parsedDate < today ? today.toISOString() : parsedDate.toISOString(),
              recurrence_end_date: row["End Date"] ? parseDateFromDDMMYYYY(row["End Date"]).toISOString() : null,
            };
          });
          batchUpsertMutation.mutate(transactionsToInsert);
        } catch (error: any) {
          showError(`Import failed: ${error.message}`);
          setIsImporting(false);
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error: any) => { showError(`CSV parsing error: ${error.message}`); setIsImporting(false); },
    });
  };

  const handleExportClick = () => {
    if (scheduledTransactions.length === 0) { showError("No transactions to export."); return; }
    const dataToExport = scheduledTransactions.map(t => ({
      "Date": t.date, "Account": t.account, "Vendor": t.vendor, "Category": t.category,
      "Amount": t.amount, "Frequency": t.frequency, "Remarks": t.remarks || '', "End Date": t.recurrence_end_date || '',
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "scheduled_transactions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAccountClick = (name: string) => navigate('/transactions', { state: { filterAccount: name } });
  const handleVendorClick = (name: string) => {
    const isAccount = allPayees.find(p => p.value === name)?.isAccount || false;
    navigate('/transactions', { state: { [isAccount ? 'filterAccount' : 'filterVendor']: name } });
  };
  const handleCategoryClick = (name: string) => { if (name !== 'Transfer') navigate('/transactions', { state: { filterCategory: name } }); };

  return {
    searchTerm, setSearchTerm, currentPage, setCurrentPage, itemsPerPage,
    isConfirmOpen, setIsConfirmOpen, selectedRows, isImporting, fileInputRef,
    isFormOpen, setIsFormOpen, editingTransaction,
    scheduledTransactions, isLoading: isLoadingScheduled || isLoadingAccounts || isLoadingVendors || isLoadingCategories || isLoadingUser,
    refetch,
    deleteMutation, saveMutation,
    handleAddClick, handleEditClick, handleDeleteClick, confirmDelete,
    handleSelectAll, handleRowSelect,
    handleImportClick, handleFileChange, handleExportClick,
    handleFormSubmit: saveMutation.mutate,
    handleAccountClick, handleVendorClick, handleCategoryClick,
    accounts, allPayees, categories,
  };
};