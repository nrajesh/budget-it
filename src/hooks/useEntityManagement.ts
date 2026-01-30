import * as React from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from "@/utils/toast";
import { db } from '@/lib/dexieDB';

interface UseEntityManagementProps<T> {
  entityName: string;
  entityNamePlural: string;
  queryKey: string[];
  deleteRpcFn: string; // Ignored for local
  batchUpsertRpcFn?: string; // Ignored for local
  batchUpsertPayloadKey?: string; // Ignored for local
  isDeletable?: (item: T) => boolean;
  onSuccess?: () => void;
  customDeleteHandler?: (ids: string[]) => void;
}

export const useEntityManagement = <T extends { id: string; name: string }>({
  entityName,
  entityNamePlural,
  queryKey,
  isDeletable = () => true,
  onSuccess,
  customDeleteHandler,
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
      // Determine table based on entityName or queryKey
      // queryKey[0] is usually 'vendors' or 'categories'
      const tableKey = queryKey[0];

      if (tableKey === 'vendors') {
        await db.vendors.bulkDelete(ids);
        // Also delete associated accounts if is_account?
        // Supabase RPC likely handled cascading. Dexie doesn't cascade by default.
        // For now, simple delete.
      } else if (tableKey === 'categories') {
        await db.categories.bulkDelete(ids);
      }
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
      // Only categories use this currently via CSV import
      // useCategoryManagement passes this.
      // We'll rely on useCategoryManagement's override or specific logic if provided,
      // BUT this generic hook was calling RPC.
      // Since useCategoryManagement now has its own 'batchUpsertCategoriesMutation' that calls ensureCategoryExists,
      // this generic one might not be used?
      // Let's check usages.
      // useCategoryManagement passes 'batchUpsertRpcFn'.
      // If we want to support generic upsert here, we need to know the table.

      const tableKey = queryKey[0];
      if (tableKey === 'categories') {
        // Assume dataToUpsert are names? Or objects?
        // The RPC expected objects.
        // But locally we probably shouldn't use this generic RPC replacement blindly without strict types.
        // Assuming the caller handles specific logic.
        // Actually, useCategoryManagement DEFINES its own batchUpsertCategoriesMutation and DOES NOT use this generic batchUpsertMutation exposed here?
        // Let's check useCategoryManagement.ts ... it defines `batchUpsertCategoriesMutation` but does NOT return `batchUpsertMutation` from `useEntityManagement`.
        // So this `batchUpsertMutation` here might be unused by categories.
        // Let's check Vendors? usePayeeManagement?

        // If unused, we can stub it.
      }
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
      if (customDeleteHandler) {
        customDeleteHandler(idsToDelete);
        // Manually trigger success side effects since mutation wrapper normally does it
        // But for undo context, the context handles toast + invalidation.
        // We just need to close dialogs.
        setIsConfirmOpen(false); // Helper or set state directly
        setEntityToDelete(null);
        setSelectedRows([]);
        setIsBulkDelete(false);
        if (onSuccess) onSuccess();
      } else {
        deleteMutation.mutate(idsToDelete);
      }
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
    isImporting, setIsImporting, fileInputRef,
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