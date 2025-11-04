import * as React from "react";
import { useEntityManagement } from "./useEntityManagement";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Category } from "@/data/finance-data";
import Papa from "papaparse";
import { showError, showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";

export const useCategoryManagement = () => {
  const { user } = useUser();
  const { categories, isLoadingCategories, refetchCategories, invalidateAllData } = useTransactions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const managementProps = useEntityManagement<Category>({
    entityName: "Category",
    entityNamePlural: "categories",
    queryKey: ['categories', user?.id],
    deleteRpcFn: 'delete_categories_batch', // This RPC needs to be created or logic adjusted
    isDeletable: (item) => item.name !== 'Others',
    onSuccess: invalidateAllData,
  });

  // Specific mutations for categories that don't fit the generic RPC model
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
      if (managementProps.fileInputRef.current) managementProps.fileInputRef.current.value = "";
    },
    onError: (error: any) => showError(`Import failed: ${error.message}`),
    onSettled: () => (managementProps as any).setIsImporting(false),
  });

  const handleAddClick = () => {
    const newCategoryName = prompt("Enter new category name:");
    if (newCategoryName?.trim()) {
      addCategoryMutation.mutate(newCategoryName);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    (managementProps as any).setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const hasHeader = results.meta.fields?.includes("Category Name");
        if (!hasHeader) {
          showError(`CSV is missing required header: "Category Name"`);
          (managementProps as any).setIsImporting(false);
          return;
        }
        const categoryNames = results.data.map((row: any) => row["Category Name"]).filter(Boolean);
        if (categoryNames.length === 0) {
          showError("No valid category names found in the CSV file.");
          (managementProps as any).setIsImporting(false);
          return;
        }
        batchUpsertCategoriesMutation.mutate(categoryNames);
      },
      error: (error: any) => {
        showError(`CSV parsing error: ${error.message}`);
        (managementProps as any).setIsImporting(false);
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
    ...managementProps,
    categories,
    isLoadingCategories,
    refetchCategories,
    addCategoryMutation,
    deleteCategoriesMutation: managementProps.deleteMutation,
    handleAddClick,
    handleFileChange,
    handleExportClick,
    handleCategoryNameClick,
    isLoadingMutation: addCategoryMutation.isPending || managementProps.deleteMutation.isPending || batchUpsertCategoriesMutation.isPending,
  };
};