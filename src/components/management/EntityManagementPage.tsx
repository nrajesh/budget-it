import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Upload, Download, Search } from "lucide-react";
import { EntityTable, ColumnDefinition } from './EntityTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EntityManagementPageProps<T> {
  title: string;
  entityName: string;
  entityNamePlural: string;
  data: T[];
  isLoading: boolean;
  columns: ColumnDefinition<T>[];
  AddEditDialogComponent: React.ComponentType<any>;
  isDeletable?: (item: T) => boolean;
  selectedEntity: T | null;
  handleAddClick: () => void;
  handleEditClick: (item: T) => void;
  handleDeleteClick: (item: T) => void;
  confirmDelete: () => void;
  handleBulkDeleteClick: () => void;
  handleSelectAll: (selectedIds: string[]) => void;
  handleRowSelect: (id: string, checked: boolean) => void;
  handleImport: (file: File) => void;
  handleExportClick: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  sortConfig: { key: keyof T; direction: 'asc' | 'desc' } | null;
  setSortConfig: (config: { key: keyof T; direction: 'asc' | 'desc' } | null) => void;
  refetch?: () => void;
}

const EntityManagementPage = <T extends { id: string, name: string }>({
  title,
  entityName,
  entityNamePlural,
  data,
  isLoading,
  columns,
  isDeletable,
  selectedEntity,
  handleAddClick,
  handleEditClick,
  handleDeleteClick,
  confirmDelete,
  handleSelectAll,
  handleRowSelect,
  handleImport,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">Manage your {entityNamePlural.toLowerCase()} and their details.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={onFileChange}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportClick}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add {entityName}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={`Search ${entityNamePlural.toLowerCase()}...`}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <EntityTable
        data={data as any}
        isLoading={isLoading}
        columns={columns as any}
        isDeletable={isDeletable as any}
        handleEditClick={handleEditClick as any}
        handleDeleteClick={handleDeleteClick as any}
        onSelectAll={handleSelectAll}
        onRowSelect={handleRowSelect}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        sortConfig={sortConfig as any}
        setSortConfig={setSortConfig as any}
      />

      <AlertDialog open={!!selectedEntity} onOpenChange={(open) => !open && handleDeleteClick(null as any)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {entityName.toLowerCase()} and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleDeleteClick(null as any)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EntityManagementPage;