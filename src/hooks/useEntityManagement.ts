import { useState, useMemo } from 'react';
import { SortConfig } from '@/types/sort';

interface EntityWithId {
  id: string;
}

export const useEntityManagement = <T extends EntityWithId>(initialData: T[]) => {
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Placeholder functions
  const handleAddClick = () => {
    setSelectedEntity(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (item: T) => {
    setSelectedEntity(item);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (item: T) => {
    setSelectedEntity(item);
    setIsConfirmDeleteOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setIsBulkDeleteOpen(true);
  };

  const handleSelectAll = (checked: boolean, currentItems: T[]) => {
    if (checked) {
      setSelectedIds(currentItems.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(itemId => itemId !== id)
    );
  };

  // Sorting and filtering logic (simplified for placeholder)
  const filteredData = useMemo(() => {
    return initialData.filter(item => 
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [initialData, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, itemsPerPage]);


  return {
    // State
    selectedEntity,
    searchTerm,
    currentPage,
    itemsPerPage,
    sortConfig,
    selectedIds,
    isDialogOpen,
    isConfirmDeleteOpen,
    isBulkDeleteOpen,
    paginatedData,
    totalItems: filteredData.length,

    // Setters
    setSelectedEntity,
    setSearchTerm,
    setCurrentPage,
    setItemsPerPage,
    setSortConfig,
    setIsDialogOpen,
    setIsConfirmDeleteOpen,
    setIsBulkDeleteOpen,
    setSelectedIds,

    // Handlers
    handleAddClick,
    handleEditClick,
    handleDeleteClick,
    handleBulkDeleteClick,
    handleSelectAll,
    handleRowSelect,
  };
};