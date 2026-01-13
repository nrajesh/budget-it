import * as React from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface UseEntityManagementProps<T> {
  entityName: string;
  entityNamePlural: string;
  queryKey: string[];
  deleteRpcFn: string;
  batchUpsertRpcFn?: string; // Optional for categories
  batchUpsertPayloadKey?: string; // Optional for categories
  isDeletable?: (item: T) => boolean;
  onSuccess?: () => void;
}

export const useEntityManagement = <T extends { id: string; name: string }>({
  entityName,
  entityNamePlural,
  queryKey,
  deleteRpcFn,
  batchUpsertRpcFn,
  batchUpsertPayloadKey,
  isDeletable = () => true,
  onSuccess,
}: UseEntityManagementProps<T>) => {
  const queryClient = useQueryClient();

  // State Management
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedEntity, setSelectedEntity] = React.useState<T | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [entityToDelete, setEntityToDelete] = React.useState<T | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isBulkDelete, setIsBulkDelete] = React.useState(false);

  // Reset pagination when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.rpc(deleteRpcFn, { p_vendor_ids: ids }); // Assuming the param name is consistent
      if (error) throw error;
    },
    onSuccess: async () => {
      showSuccess(isBulkDelete ? `${selectedRows.length} ${entityNamePlural} deleted successfully.` : `${entityName} deleted successfully.`);
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey });
      if (onSuccess) onSuccess();
      setIsConfirmOpen(false);
      setEntityToDelete(null);
      setSelectedRows([]);
      setIsBulkDelete(false);
    },
    onError: (error: any) => showError(`Failed to delete: ${error.message}`),
  });

  const batchUpsertMutation = useMutation({
    mutationFn: async (dataToUpsert: any[]) => {
      if (!batchUpsertRpcFn || !batchUpsertPayloadKey) {
        throw new Error("Batch upsert RPC function or payload key is not defined.");
      }
      const payload = { [batchUpsertPayloadKey]: dataToUpsert };
      const { error } = await supabase.rpc(batchUpsertRpcFn, payload);
      if (error) throw error;
    },
    onSuccess: async (_data, variables) => {
      showSuccess(`${variables.length} ${entityNamePlural} imported successfully!`);
      await queryClient.invalidateQueries({ queryKey });
      if (onSuccess) onSuccess();
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: any) => showError(`Import failed: ${error.message}`),
    onSettled: () => setIsImporting(false),
  });

  // Handlers
  const handleAddClick = () => {
    setSelectedEntity(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (entity: T) => {
    setSelectedEntity(entity);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (entity: T) => {
    setEntityToDelete(entity);
    setIsBulkDelete(false);
    setIsConfirmOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setEntityToDelete(null);
    setIsBulkDelete(true);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    const idsToDelete = isBulkDelete ? selectedRows : (entityToDelete ? [entityToDelete.id] : []);
    if (idsToDelete.length > 0) {
      deleteMutation.mutate(idsToDelete);
    } else {
      setIsConfirmOpen(false);
    }
  };

  const handleSelectAll = (checked: boolean, currentEntities: T[]) => {
    setSelectedRows(checked ? currentEntities.filter(isDeletable).map(p => p.id) : []);
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedRows(prev => checked ? [...prev, id] : prev.filter((rowId) => rowId !== id));
  };

  const handleImportClick = () => fileInputRef.current?.click();

  return {
    searchTerm, setSearchTerm,
    currentPage, setCurrentPage,
    itemsPerPage,
    isDialogOpen, setIsDialogOpen,
    selectedEntity,
    isConfirmOpen, setIsConfirmOpen,
    selectedRows,
    isImporting, fileInputRef,
    deleteMutation,
    batchUpsertMutation,
    isLoadingMutation: deleteMutation.isPending || batchUpsertMutation.isPending,
    handleAddClick,
    handleEditClick,
    handleDeleteClick,
    confirmDelete,
    handleBulkDeleteClick,
    handleSelectAll,
    handleRowSelect,
    handleImportClick,
  };
};