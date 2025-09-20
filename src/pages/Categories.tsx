import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { PlusCircle, Trash2, Loader2, RotateCcw, Upload, Download } from "lucide-react";
import { useTransactions } from "@/contexts/TransactionsContext";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { useMutation } from '@tanstack/react-query';

export type Category = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  totalTransactions?: number;
};

const CategoriesPage = () => {
  const { invalidateAllData } = useTransactions();
  const {
    categories, isLoadingCategories, refetchCategories,
    searchTerm, setSearchTerm, currentPage, setCurrentPage, itemsPerPage,
    isConfirmOpen, setIsConfirmOpen,
    selectedRows,
    isImporting, fileInputRef,
    addCategoryMutation, deleteCategoriesMutation,
    handleAddClick, handleDeleteClick, confirmDelete,
    handleSelectAll, handleRowSelect,
    handleImportClick, handleFileChange, handleExportClick,
    handleCategoryNameClick,
    isLoadingMutation,
  } = useCategoryManagement();

  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [editedName, setEditedName] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const updateCategoryNameMutation = useMutation({
    mutationFn: async ({ categoryId, newName }: { categoryId: string; newName: string }) => {
      const { error } = await supabase.from('categories').update({ name: newName.trim() }).eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: async () => {
      showSuccess("Category name updated successfully!");
      await invalidateAllData();
      setEditingCategoryId(null);
    },
    onError: (error: any) => showError(`Failed to update category name: ${error.message}`),
  });

  const startEditing = (category: { id: string; name: string }) => {
    setEditingCategoryId(category.id);
    setEditedName(category.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSaveName = (categoryId: string, originalName: string) => {
    if (editedName.trim() === "" || editedName === originalName) {
      setEditingCategoryId(null);
      return;
    }
    updateCategoryNameMutation.mutate({ categoryId, newName: editedName.trim() });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, category: { id: string; name: string }) => {
    if (event.key === 'Enter') event.currentTarget.blur();
    else if (event.key === 'Escape') setEditingCategoryId(null);
  };

  const filteredCategories = React.useMemo(() => {
    return categories.filter((cat) => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [categories, searchTerm]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  const numSelected = selectedRows.length;
  const rowCount = currentCategories.length;

  return (
    <div className="flex-1 space-y-4">
      <LoadingOverlay isLoading={isLoadingCategories || isImporting || isLoadingMutation || updateCategoryNameMutation.isPending} message={isImporting ? "Importing categories..." : "Loading categories..."} />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
        <div className="flex items-center space-x-2">
          {numSelected > 0 && (
            <Button variant="destructive" onClick={() => handleDeleteClick(selectedRows as any)} disabled={deleteCategoriesMutation.isPending}>
              {deleteCategoriesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete ({numSelected})
            </Button>
          )}
          <Button onClick={handleImportClick} variant="outline" disabled={isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import CSV
          </Button>
          <Button onClick={handleExportClick} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleAddClick} disabled={addCategoryMutation.isPending}>
            {addCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <PlusCircle className="mr-2 h-4 w-4" /> Add Category
          </Button>
          <Button variant="outline" size="icon" onClick={async () => await refetchCategories()} disabled={isLoadingCategories}>
            {isLoadingCategories ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            <span className="sr-only">Refresh Categories</span>
          </Button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
          <div className="mt-4">
            <Input placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox checked={rowCount > 0 && numSelected === rowCount} onCheckedChange={(checked) => handleSelectAll(Boolean(checked), currentCategories)} aria-label="Select all" />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCategories ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                ) : currentCategories.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No categories found.</TableCell></TableRow>
                ) : (
                  currentCategories.map((category) => (
                    <TableRow key={category.id} data-state={selectedRows.includes(category.id) && "selected"}>
                      <TableCell>
                        <Checkbox checked={selectedRows.includes(category.id)} onCheckedChange={(checked) => handleRowSelect(category.id, Boolean(checked))} aria-label="Select row" />
                      </TableCell>
                      <TableCell className="font-medium">
                        {editingCategoryId === category.id ? (
                          <Input ref={inputRef} value={editedName} onChange={(e) => setEditedName(e.target.value)} onBlur={() => handleSaveName(category.id, category.name)} onKeyDown={(e) => handleKeyDown(e, category)} disabled={updateCategoryNameMutation.isPending} className="h-8" />
                        ) : (
                          <div onClick={() => handleCategoryNameClick(category.name)} className="cursor-pointer hover:text-primary hover:underline">{category.name}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {updateCategoryNameMutation.isPending && editingCategoryId === category.id ? (
                          <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => startEditing(category)}><Trash2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(category)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {numSelected > 0 ? `${numSelected} of ${filteredCategories.length} row(s) selected.` : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredCategories.length)} of ${filteredCategories.length} categories`}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} /></PaginationItem>
              <PaginationItem><PaginationNext onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
      <ConfirmationDialog isOpen={isConfirmOpen} onOpenChange={setIsConfirmOpen} onConfirm={confirmDelete} title="Are you sure?" description="This will permanently delete the selected category(ies). Transactions associated with these categories will have their category field cleared. This action cannot be undone." confirmText="Delete" />
    </div>
  );
};

export default CategoriesPage;