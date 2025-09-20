import * as React from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTransactions } from "@/contexts/TransactionsContext";
import { Payee } from "@/components/AddEditPayeeDialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";

export const usePayeeManagement = (isAccount: boolean) => {
  const { invalidateAllData } = useTransactions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const entityName = isAccount ? "Account" : "Vendor";
  const entityNamePlural = isAccount ? "accounts" : "vendors";

  // State Management
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedPayee, setSelectedPayee] = React.useState<Payee | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [payeeToDelete, setPayeeToDelete] = React.useState<Payee | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Mutations
  const deletePayeesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.rpc('delete_payees_batch', { p_vendor_ids: ids });
      if (error) throw error;
    },
    onSuccess: async () => {
      showSuccess(payeeToDelete ? `${entityName} deleted successfully.` : `${selectedRows.length} ${entityNamePlural} deleted successfully.`);
      await invalidateAllData();
      setIsConfirmOpen(false);
      setPayeeToDelete(null);
      setSelectedRows([]);
    },
    onError: (error: any) => showError(`Failed to delete: ${error.message}`),
  });

  const batchUpsertMutation = useMutation({
    mutationFn: async (dataToUpsert: any[]) => {
      const rpcName = isAccount ? 'batch_upsert_accounts' : 'batch_upsert_vendors';
      const payloadKey = isAccount ? 'p_accounts' : 'p_names';
      const payload = isAccount ? { [payloadKey]: dataToUpsert } : { [payloadKey]: dataToUpsert.map(d => d.name) };
      const { error } = await supabase.rpc(rpcName, payload);
      if (error) throw error;
    },
    onSuccess: async (data, variables) => {
      showSuccess(`${variables.length} ${entityNamePlural} imported successfully!`);
      await invalidateAllData();
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: any) => showError(`Import failed: ${error.message}`),
    onSettled: () => setIsImporting(false),
  });

  // Handlers
  const handleAddClick = () => {
    setSelectedPayee(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (payee: Payee) => {
    setSelectedPayee(payee);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (payee: Payee) => {
    setPayeeToDelete(payee);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    const idsToDelete = payeeToDelete ? [payeeToDelete.id] : selectedRows;
    deletePayeesMutation.mutate(idsToDelete);
  };

  const handleSelectAll = (checked: boolean, currentPayees: Payee[]) => {
    setSelectedRows(checked ? currentPayees.map((p) => p.id) : []);
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedRows(prev => checked ? [...prev, id] : prev.filter((rowId) => rowId !== id));
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredHeaders = isAccount ? ["Account Name", "Currency", "Starting Balance", "Remarks"] : ["Vendor Name"];
        const hasAllHeaders = requiredHeaders.every(h => results.meta.fields?.includes(h));

        if (!hasAllHeaders) {
          showError(`CSV is missing required headers: ${requiredHeaders.join(", ")}`);
          setIsImporting(false);
          return;
        }

        const dataToUpsert = results.data.map((row: any) => isAccount
          ? { name: row["Account Name"], currency: row["Currency"], starting_balance: parseFloat(row["Starting Balance"]) || 0, remarks: row["Remarks"] }
          : { name: row["Vendor Name"] }
        ).filter(item => item.name);

        if (dataToUpsert.length === 0) {
          showError(`No valid ${entityName.toLowerCase()} data found in the CSV file.`);
          setIsImporting(false);
          return;
        }
        batchUpsertMutation.mutate(dataToUpsert);
      },
      error: (error: any) => {
        showError(`CSV parsing error: ${error.message}`);
        setIsImporting(false);
      },
    });
  };

  const handleExportClick = (payees: Payee[]) => {
    if (payees.length === 0) {
      showError(`No ${entityNamePlural} to export.`);
      return;
    }
    const dataToExport = payees.map(p => isAccount
      ? { "Account Name": p.name, "Currency": p.currency, "Starting Balance": p.starting_balance, "Remarks": p.remarks }
      : { "Vendor Name": p.name }
    );
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `${entityNamePlural}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePayeeNameClick = (payeeName: string) => {
    const filterKey = isAccount ? 'filterAccount' : 'filterVendor';
    navigate('/transactions', { state: { [filterKey]: payeeName } });
  };

  return {
    searchTerm, setSearchTerm, currentPage, setCurrentPage, itemsPerPage,
    isDialogOpen, setIsDialogOpen, selectedPayee,
    isConfirmOpen, setIsConfirmOpen,
    selectedRows,
    isImporting, fileInputRef,
    deletePayeesMutation,
    handleAddClick, handleEditClick, handleDeleteClick, confirmDelete,
    handleSelectAll, handleRowSelect,
    handleImportClick, handleFileChange, handleExportClick,
    handlePayeeNameClick,
    isLoadingMutation: deletePayeesMutation.isPending || batchUpsertMutation.isPending,
  };
};