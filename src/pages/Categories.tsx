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
import { PlusCircle, Trash2, Edit, Loader2, RotateCcw, Upload, Download } from "lucide-react";
import { useTransactions } from "@/contexts/TransactionsContext";
import Papa from "papaparse";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useUser } from "@/contexts/UserContext";

export type Category = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
};

const CategoriesPage = () => {
  const { categories, fetchCategories, fetchTransactions } = useTransactions();
  const { user } = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);

  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [editedName, setEditedName] = React.useState<string>("");
  const [isSavingName, setIsSavingName] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      await fetchCategories();
      setIsLoading(false);
    };
    loadCategories();
  }, [fetchCategories]);

  const filteredCategories = React.useMemo(() => {
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  const handleAddClick = async () => {
    if (!user) {
      showError("You must be logged in to add a category.");
      return;
    }
    const newCategoryName = prompt("Enter new category name:");
    if (newCategoryName && newCategoryName.trim() !== "") {
      if (newCategoryName.trim().toLowerCase() === 'others') {
        showError("Category name 'Others' is reserved and cannot be added manually.");
        return;
      }
      try {
        const { error } = await supabase.from('categories').insert({
          name: newCategoryName.trim(),
          user_id: user.id,
        });
        if (error) throw error;
        showSuccess("Category added successfully!");
        fetchCategories();
      } catch (error: any) {
        showError(`Failed to add category: ${error.message}`);
      }
    }
  };

  const handleDeleteClick = (category: Category) => {
    if (category.name === 'Others') {
      showError("The 'Others' category cannot be deleted.");
      return;
    }
    setCategoryToDelete(category);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!user) {
      showError("You must be logged in to delete categories.");
      setIsConfirmOpen(false);
      return;
    }

    const categoriesToDelete = categoryToDelete ? [categoryToDelete] : categories.filter(cat => selectedRows.includes(cat.id));
    const deletableCategories = categoriesToDelete.filter(cat => cat.name !== 'Others');

    if (deletableCategories.length === 0) {
      showError("No deletable categories selected.");
      setIsConfirmOpen(false);
      setCategoryToDelete(null);
      setSelectedRows([]);
      return;
    }

    const idsToDelete = deletableCategories.map(cat => cat.id);
    const namesToDelete = deletableCategories.map(cat => cat.name);
    const successMessage = deletableCategories.length === 1 ? `Category '${deletableCategories[0].name}' deleted successfully.` : `${deletableCategories.length} categories deleted successfully.`;

    try {
      // Find the 'Others' category ID for the current user
      const { data: othersCategory, error: fetchOthersError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Others')
        .eq('user_id', user.id)
        .single();

      if (fetchOthersError || !othersCategory) {
        throw new Error("Default 'Others' category not found. Cannot reassign transactions.");
      }

      // Step 1: Reassign transactions from deleted categories to 'Others'
      const { error: updateTransactionsError } = await supabase
        .from('transactions')
        .update({ category: 'Others' })
        .in('category', namesToDelete); // Update transactions by category name

      if (updateTransactionsError) {
        throw updateTransactionsError;
      }

      // Step 2: Delete the categories
      const { error: deleteCategoriesError } = await supabase
        .from('categories')
        .delete()
        .in('id', idsToDelete)
        .eq('user_id', user.id);

      if (deleteCategoriesError) {
        throw deleteCategoriesError;
      }

      showSuccess(successMessage);
      fetchCategories();
      fetchTransactions(); // Re-fetch transactions to update any affected entries
    } catch (error: any) {
      showError(`Failed to delete categories: ${error.message}`);
    } finally {
      setIsConfirmOpen(false);
      setCategoryToDelete(null);
      setSelectedRows([]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(currentCategories.filter(cat => cat.name !== 'Others').map((cat) => cat.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    const category = categories.find(cat => cat.id === id);
    if (category?.name === 'Others') {
      showError("The 'Others' category cannot be selected for deletion.");
      return;
    }
    if (checked) {
      setSelectedRows((prev) => [...prev, id]);
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
    }
  };

  const startEditing = (category: Category) => {
    if (category.name === 'Others') {
      showError("The 'Others' category name cannot be changed.");
      return;
    }
    setEditingCategoryId(category.id);
    setEditedName(category.name);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSaveName = async (categoryId: string, originalName: string) => {
    if (!user) {
      showError("You must be logged in to edit categories.");
      setEditingCategoryId(null);
      return;
    }
    if (editedName.trim() === "" || editedName === originalName) {
      setEditingCategoryId(null);
      return;
    }
    if (editedName.trim().toLowerCase() === 'others') {
      showError("Category name 'Others' is reserved and cannot be used.");
      setEditingCategoryId(null);
      return;
    }

    setIsSavingName(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editedName.trim() })
        .eq('id', categoryId)
        .eq('user_id', user.id); // Ensure user can only update their own categories

      if (error) throw error;
      showSuccess("Category name updated successfully!");
      fetchCategories();
      fetchTransactions(); // Re-fetch transactions to update any affected entries
    } catch (error: any) {
      showError(`Failed to update category name: ${error.message}`);
    } finally {
      setIsSavingName(false);
      setEditingCategoryId(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, category: Category) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      setEditingCategoryId(null);
    }
  };

  const numSelected = selectedRows.length;
  const rowCount = currentCategories.length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCategories();
    setIsRefreshing(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!user) {
      showError("You must be logged in to import categories.");
      return;
    }

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const requiredHeaders = ["Category Name"];
        const actualHeaders = results.meta.fields || [];
        const hasAllHeaders = requiredHeaders.every(h => actualHeaders.includes(h));

        if (!hasAllHeaders) {
          showError(`CSV is missing required header: "Category Name"`);
          setIsImporting(false);
          return;
        }

        const categoryNames = results.data.map((row: any) => row["Category Name"]).filter(Boolean);

        if (categoryNames.length === 0) {
          showError("No valid category names found in the CSV file.");
          setIsImporting(false);
          return;
        }

        try {
          const categoriesToInsert = categoryNames
            .filter((name: string) => name.trim().toLowerCase() !== 'others') // Prevent importing 'Others'
            .map((name: string) => ({
              name: name.trim(),
              user_id: user.id,
            }));

          if (categoriesToInsert.length === 0) {
            showSuccess("No new categories to import (or only 'Others' was present).");
            setIsImporting(false);
            return;
          }

          const { error } = await supabase.from('categories').upsert(categoriesToInsert, { onConflict: 'user_id,name', ignoreDuplicates: true });

          if (error) throw error;

          showSuccess(`${categoriesToInsert.length} categories imported successfully!`);
          await fetchCategories();
        } catch (error: any) {
          showError(`Import failed: ${error.message}`);
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      },
      error: (error: any) => {
        showError(`CSV parsing error: ${error.message}`);
        setIsImporting(false);
      },
    });
  };

  const handleExportClick = () => {
    if (categories.length === 0) {
      showError("No categories to export.");
      return;
    }

    const dataToExport = categories.map(cat => ({
      "Category Name": cat.name,
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "categories_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-4">
      <LoadingOverlay isLoading={isImporting || isRefreshing} message={isImporting ? "Importing categories..." : "Refreshing categories..."} />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
        <div className="flex items-center space-x-2">
          {numSelected > 0 && (
            <Button variant="destructive" onClick={() => setIsConfirmOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
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
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Category
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            <span className="sr-only">Refresh Categories</span>
          </Button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".csv"
      />
      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
          <div className="mt-4">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={rowCount > 0 && numSelected === rowCount}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : currentCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentCategories.map((category) => (
                    <TableRow key={category.id} data-state={selectedRows.includes(category.id) && "selected"}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(category.id)}
                          onCheckedChange={(checked) => handleRowSelect(category.id, Boolean(checked))}
                          aria-label="Select row"
                          disabled={category.name === 'Others'}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {editingCategoryId === category.id ? (
                          <Input
                            ref={inputRef}
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={() => handleSaveName(category.id, category.name)}
                            onKeyDown={(e) => handleKeyDown(e, category)}
                            disabled={isSavingName || category.name === 'Others'}
                            className="h-8"
                          />
                        ) : (
                          <div
                            onClick={() => startEditing(category)}
                            className={category.name === 'Others' ? "cursor-default text-muted-foreground" : "cursor-pointer hover:text-primary"}
                          >
                            {category.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isSavingName && editingCategoryId === category.id ? (
                          <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(category)}
                            disabled={category.name === 'Others'}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
            {numSelected > 0
              ? `${numSelected} of ${filteredCategories.length} row(s) selected.`
              : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredCategories.length)} of ${filteredCategories.length} categories`}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDelete}
        title="Are you sure?"
        description="This will permanently delete the selected category(ies). All transactions associated with these categories will be reassigned to the 'Others' category. This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

export default CategoriesPage;