import { useState, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UseEntityManagementProps<T> {
  data: T[];
  entityName: string;
  entityNamePlural: string;
  queryKey: any[];
  deleteRpcFn?: string | ((ids: string[]) => Promise<any>);
  batchUpsertRpcFn?: string | ((data: any[]) => Promise<any>);
}

export function useEntityManagement<T extends { id: string; name: string }>(props: UseEntityManagementProps<T>) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!props.deleteRpcFn) throw new Error("No delete RPC function provided");
      if (typeof props.deleteRpcFn === 'string') {
        const { error } = await supabase.rpc(props.deleteRpcFn, { p_vendor_ids: ids });
        if (error) throw error;
      } else {
        await props.deleteRpcFn(ids);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: props.queryKey });
      toast.success(`${props.entityNamePlural} deleted successfully`);
      setIsConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Error deleting ${props.entityName.toLowerCase()}: ${error.message}`);
    }
  });

  const batchUpsertMutation = useMutation({
    mutationFn: async (data: any[]) => {
      if (!props.batchUpsertRpcFn) throw new Error("No batch upsert RPC function provided");
      if (typeof props.batchUpsertRpcFn === 'string') {
        const { error } = await supabase.rpc(props.batchUpsertRpcFn, { p_names: data });
        if (error) throw error;
      } else {
        await props.batchUpsertRpcFn(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: props.queryKey });
      toast.success(`${props.entityNamePlural} imported successfully`);
    },
    onError: (error: any) => {
      toast.error(`Error importing ${props.entityNamePlural.toLowerCase()}: ${error.message}`);
    }
  });

  const filteredData = useMemo(() => {
    return props.data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [props.data, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  return {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    selectedEntity,
    setSelectedEntity,
    isConfirmOpen,
    setIsConfirmOpen,
    sortConfig,
    setSortConfig,
    filteredData,
    paginatedData,
    fileInputRef,
    deleteMutation,
    batchUpsertMutation,
    handleAddClick: () => setSelectedEntity(null),
    handleEditClick: (entity: T) => setSelectedEntity(entity),
    handleDeleteClick: (entity: T) => {
      setSelectedEntity(entity);
      setIsConfirmOpen(true);
    },
    handleBulkDeleteClick: () => setIsConfirmOpen(true),
    handleSelectAll: () => {},
    handleRowSelect: () => {},
    handleImportClick: () => fileInputRef.current?.click(),
    handleExportClick: () => {},
  };
}