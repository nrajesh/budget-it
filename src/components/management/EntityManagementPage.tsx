import * as React from "react";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination";
import { PlusCircle, Trash2, Loader2, RotateCcw, Upload, Download } from "lucide-react";
import LoadingOverlay from "@/components/LoadingOverlay";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { EntityTable, ColumnDefinition } from "./EntityTable";

interface ManagementProps<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  selectedRows: string[];
  isImporting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  deletePayeesMutation?: any; // Make mutations optional for categories
  deleteCategoriesMutation?: any;
  isLoadingMutation: boolean;
  handleAddClick: () => void;
  handleDeleteClick: (item: T) => void;
  confirmDelete: () => void;
  handleBulkDeleteClick: () => void;
  handleSelectAll: (checked: boolean, currentItems: T[]) => void;
  handleRowSelect: (id: string, checked: boolean) => void;
  handleImportClick: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportClick: (items: T[]) => void;
  isConfirmOpen: boolean;
  setIsConfirmOpen: (isOpen: boolean) => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  selectedPayee?: T | null; // Make specific props optional
  selectedCategory?: T | null;
}

interface EntityManagementPageProps<T extends { id: string; name: string }> {
  title: string;
  entityName: string;
  entityNamePlural: string;
  data: T[];
  isLoading: boolean;
  columns: ColumnDefinition<T>[];
  managementProps: any; // Using any for simplicity, can be typed better
  AddEditDialogComponent?: React.FC<any>;
  isDeletable?: (item: T) => boolean;
  isEditable?: (item: T) => boolean;
  customEditHandler?: (item: T) => void;
  isEditing?: (id: string) => boolean;
  isUpdating?: boolean;
}

const EntityManagementPage = <T extends { id: string; name: string }>({
  title,
  entityName,
  entityNamePlural,
  data,
  isLoading,
  columns,
  managementProps,
  AddEditDialogComponent,
  isDeletable = () => true,
  isEditable = () => true,
  customEditHandler,
  isEditing = () => false,
  isUpdating = false,
}: EntityManagementPageProps<T>) => {
  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage, itemsPerPage,
    isDialogOpen, setIsDialogOpen, selectedPayee,
    isConfirmOpen, setIsConfirmOpen,
    selectedRows,
    isImporting, fileInputRef,
    deletePayeesMutation, deleteCategoriesMutation,
    isLoadingMutation,
    handleAddClick, handleDeleteClick, confirmDelete, handleBulkDeleteClick,
    handleSelectAll, handleRowSelect,
    handleImportClick, handleFileChange, handleExportClick,
  } = managementProps;

  const deleteMutation = deletePayeesMutation || deleteCategoriesMutation;

  const filteredData = React.useMemo(() => {
    return data.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const numSelected = selectedRows.length;

  return (
    <div className="flex-1 space-y-4">
      <LoadingOverlay isLoading={isLoading || isImporting || isLoadingMutation} message={isImporting ? `Importing ${entityNamePlural}...` : `Loading ${entityNamePlural}...`} />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <div className="flex items-center space-x-2">
          {numSelected > 0 && (
            <Button variant="destructive" onClick={handleBulkDeleteClick} disabled={deleteMutation?.isPending}>
              {deleteMutation?.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete ({numSelected})
            </Button>
          )}
          <Button onClick={handleImportClick} variant="outline" disabled={isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import CSV
          </Button>
          <Button onClick={() => handleExportClick(data)} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add {entityName}
          </Button>
          <Button variant="outline" size="icon" onClick={async () => await managementProps.refetch?.()} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
      <Card>
        <CardHeader>
          <CardTitle>Manage Your {title}</CardTitle>
          <div className="mt-4">
            <Input placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <EntityTable
            data={currentData}
            columns={columns}
            isLoading={isLoading}
            selectedRows={selectedRows}
            handleRowSelect={(id, checked) => {
              if (id.includes(',')) { // Hack for select all
                handleSelectAll(checked, currentData);
              } else {
                handleRowSelect(id, checked);
              }
            }}
            handleEditClick={customEditHandler || managementProps.handleEditClick}
            handleDeleteClick={handleDeleteClick}
            isDeletable={isDeletable}
            isEditing={isEditing}
            isUpdating={isUpdating}
          />
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {numSelected > 0 ? `${numSelected} of ${filteredData.length} row(s) selected.` : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredData.length)} of ${filteredData.length} ${entityNamePlural}`}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))} disabled={currentPage === 1} /></PaginationItem>
              <PaginationItem><PaginationNext onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
      {AddEditDialogComponent && (
        <AddEditDialogComponent
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          payee={selectedPayee}
        />
      )}
      <ConfirmationDialog isOpen={isConfirmOpen} onOpenChange={setIsConfirmOpen} onConfirm={confirmDelete} title="Are you sure?" description="This will permanently delete the selected item(s) and may affect related transactions. This action cannot be undone." confirmText="Delete" />
    </div>
  );
};

export default EntityManagementPage;