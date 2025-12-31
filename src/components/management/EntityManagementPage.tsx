import React from 'react';
import { ColumnDefinition, EntityTable } from './EntityTable';

interface EntityManagementPageProps<T extends { id: string; name: string }> {
  title: string;
  entityName: string;
  entityNamePlural: string;
  data: T[];
  isLoading: boolean;
  columns: ColumnDefinition<T>[];
  AddEditDialogComponent: React.ComponentType<any>;
  selectedEntity: T | null;
  handleAddClick: () => void;
  handleEditClick: (entity: T) => void;
  handleDeleteClick: (entity: T) => void;
  confirmDelete: () => void;
  isDeletable?: (entity: T) => boolean;
  isEditable?: (entity: T) => boolean;
  handleBulkDeleteClick: () => void;
  handleSelectAll: (selectedIds: string[]) => void;
  handleRowSelect: (id: string, selected: boolean) => void;
  handleImportClick: () => void;
  handleExportClick: (items: T[]) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  sortConfig: any;
  setSortConfig: (config: any) => void;
}

const EntityManagementPage = <T extends { id: string; name: string }>(props: EntityManagementPageProps<T>) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{props.title}</h1>
      </div>
      
      {/* Search and Action Bar placeholder */}
      
      <EntityTable
        data={props.data}
        columns={props.columns}
        isLoading={props.isLoading}
        handleEditClick={props.handleEditClick}
        handleDeleteClick={props.handleDeleteClick}
        isDeletable={props.isDeletable}
        isEditable={props.isEditable}
        onRowSelect={props.handleRowSelect}
        onSelectAll={props.handleSelectAll}
      />
      
      <props.AddEditDialogComponent 
        entity={props.selectedEntity} 
        onClose={() => {}} 
      />
    </div>
  );
};

export default EntityManagementPage;