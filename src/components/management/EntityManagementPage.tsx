import React from 'react';
import { ColumnDefinition } from './EntityTable';
import { SortConfig } from '@/types/sort';

interface EntityManagementPageProps<T> {
  title: string;
  entityName: string;
  entityNamePlural: string;
  data: T[];
  isLoading: boolean;
  columns: ColumnDefinition<T>[];
  AddEditDialogComponent: React.FC<any>;
  selectedEntity: T | null;
  handleAddClick: () => void;
  handleEditClick: (item: T) => void;
  handleDeleteClick: (item: T) => void;
  confirmDelete: () => void;
  isDeletable: (item: T) => boolean;
  isEditable: (item: T) => boolean;
  handleBulkDeleteClick: () => void;
  handleSelectAll: (checked: boolean, currentItems: T[]) => void;
  handleRowSelect: (id: string, checked: boolean) => void;
  handleImportClick: () => void;
  handleExportClick: (items: T[]) => void;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
  sortConfig: SortConfig;
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfig>>;
}

const EntityManagementPage = <T extends { id: string }>({
  title,
  entityName,
  entityNamePlural,
  data,
  isLoading,
  columns,
  AddEditDialogComponent,
  selectedEntity,
  handleAddClick,
  handleEditClick,
  handleDeleteClick,
  confirmDelete,
  isDeletable,
  isEditable,
  handleBulkDeleteClick,
  handleSelectAll,
  handleRowSelect,
  handleImportClick,
  handleExportClick,
  searchTerm,
  setSearchTerm,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  sortConfig,
  setSortConfig,
}: EntityManagementPageProps<T>) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      {/* Placeholder for table and controls */}
      <p>Displaying {data.length} {entityNamePlural}</p>
    </div>
  );
};

export default EntityManagementPage;