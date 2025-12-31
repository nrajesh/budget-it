import React from 'react';
import { ColumnDefinition, EntityTable } from './EntityTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Download, Upload, Search } from 'lucide-react';

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
  refetch?: () => void;
}

function EntityManagementPage<T extends { id: string; name: string }>(props: EntityManagementPageProps<T>) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{props.title}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={props.handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => props.handleExportClick([])}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={props.handleAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add {props.entityName}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${props.entityNamePlural.toLowerCase()}...`}
            className="pl-8"
            value={props.searchTerm}
            onChange={(e) => props.setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
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
      </div>
      
      <props.AddEditDialogComponent 
        entity={props.selectedEntity} 
        onClose={() => props.handleEditClick(null as any)} 
      />
    </div>
  );
}

export default EntityManagementPage;