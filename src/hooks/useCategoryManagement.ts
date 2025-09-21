import * as React from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTransactions } from "@/contexts/TransactionsContext";
import { useUser } from "@/contexts/UserContext";
import { Category } from "@/pages/Categories";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";

export const useCategoryManagement = () => {
  const { user } = useUser();
  const { categories, isLoadingCategories, refetchCategories, invalidateAllData } = useTransactions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State Management
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isBulkDelete, setIsBulkDelete] = React.useState(false);

  // Mutations
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategoryName: string) => {
      if (!user) throw new Error("User not logged in.");
      const { error } = await supabase.from('categories').insert({ name: newCategoryName.trim(), user_id: user.id });
      if (error) throw error;
    },
    onSuccess: async () => {
      showSuccess("Category added successfully!");
      await refetchCategories();
    },
    onError: (error: any) => showError(`Failed to add category: ${error.message}`),
  });

  const deleteCategoriesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) throw new Error("User not logged in.");
      const { error } = await supabase.from('categories').delete().in('id', ids).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      showSuccess(isBulkDelete ? `${selectedRows.length} categories deleted successfully.` : "Category deleted successfully.");
      await invalidateAllData();
      setIsConfirmOpen(false);
      setCategoryToDelete(null);
      setSelectedRows([]);
      setIsBulkDelete(false);
    },
    onError: (error: any) => showError(`Failed to delete: ${error.message}`),
  });

  const batchUpsertCategoriesMutation = useMutation({
    mutationFn: async (categoryNames: string[]) => {
      if (!user) throw new Error("User not logged in.");
      const categoriesToInsert = categoryNames.map((name: string) => ({ name: name.trim(), user_id: user.id }));
      const { error } = await supabase.from('categories').upsert(categoriesToInsert, { onConflict: 'name', ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: async (data, variables) => {
      showSuccess(`${variables.length} categories imported successfully!`);
      await refetchCategories();
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: any) => showError(`Import failed: ${error.message}`),
    onSettled: () => setIsImporting(false),
  });

  // Handlers
  const handleAddClick = () => {
    const newCategoryName = prompt("Enter new category name:");
    if (newCategoryName?.trim()) {
      addCategoryMutation.mutate(newCategoryName);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsBulkDelete(false);
    setIsConfirmOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setCategoryToDelete(null);
    setIsBulkDelete(true);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    const idsToDelete = isBulkDelete ? selectedRows : (categoryToDelete ? [categoryToDelete.id] : []);
    if (idsToDelete.length > 0) {
      deleteCategoriesMutation.mutate(idsToDelete);
    } else {
      setIsConfirmOpen(false);
    }
  };

  const handleSelectAll = (checked: boolean, currentCategories: Category[]) => {
    setSelectedRows(checked ? currentCategories.map((c) => c.id) : []);
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedRows(prev => checked ? [...prev, id] : prev.filter((rowId) => rowId !== id));
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const hasHeader = results.meta.fields?.includes("Category Name");
        if (!hasHeader) {
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
        batchUpsertCategoriesMutation.mutate(categoryNames);
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
    const dataToExport = categories.map(cat => ({ "Category Name": cat.name }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "categories_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCategoryNameClick = (categoryName: string) => {
    navigate('/transactions', { state: { filterCategory: categoryName } });
  };

  return {
    categories, isLoadingCategories, refetchCategories,
    searchTerm, setSearchTerm, currentPage, setCurrentPage, itemsPerPage,
    isConfirmOpen, setIsConfirmOpen,
    selectedRows,
    isImporting, fileInputRef,
    addCategoryMutation, deleteCategoriesMutation,
    handleAddClick, handleDeleteClick, confirmDelete, handleBulkDeleteClick,
    handleSelectAll, handleRowSelect,
    handleImportClick, handleFileChange, handleExportClick,
    handleCategoryNameClick,
    isLoadingMutation: addCategoryMutation.isPending || deleteCategoriesMutation.isPending || batchUpsertCategoriesMutation.isPending,
  };
};