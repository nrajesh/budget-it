import * as React from "react";
import { useEntityManagement } from "./useEntityManagement";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Category } from "@/data/finance-data";
import Papa from "papaparse";
import { showError, showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { useMutation } from '@tanstack/react-query';
import { useUser } from "@/contexts/UserContext";
import { useDataProvider } from '@/context/DataProviderContext';
import { db } from '@/lib/dexieDB';

export const useCategoryManagement = () => {
  const { user } = useUser();
  const { categories, isLoadingCategories, refetchCategories, invalidateAllData, deleteEntity } = useTransactions();
  const navigate = useNavigate();
  const dataProvider = useDataProvider();

  const managementProps = useEntityManagement<Category>({
    entityName: "Category",
    entityNamePlural: "categories",
    queryKey: ['categories', user?.id || ''],
    deleteRpcFn: 'delete_categories_batch', // Ignored in local version as generic hook likely needs update too
    isDeletable: (item) => item.name !== 'Others',
    onSuccess: invalidateAllData,
    customDeleteHandler: (ids) => deleteEntity('category', ids),
  });

  // Specific mutations for categories that don't fit the generic RPC model
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategoryName: string) => {
      if (!user?.id) throw new Error("User not logged in.");
      await dataProvider.ensureCategoryExists(newCategoryName.trim(), user.id);
    },
    onSuccess: async () => {
      showSuccess("Category added successfully!");
      await refetchCategories();
    },
    onError: (error: any) => showError(`Failed to add category: ${error.message}`),
  });

  const batchUpsertCategoriesMutation = useMutation({
    mutationFn: async (categoryNames: string[]) => {
      if (!user?.id) throw new Error("User not logged in.");
      await Promise.all(categoryNames.map(name => dataProvider.ensureCategoryExists(name.trim(), user.id)));
    },
    onSuccess: async (_data, variables) => {
      showSuccess(`${variables.length} categories imported successfully!`);
      await refetchCategories();
      if (managementProps.fileInputRef.current) managementProps.fileInputRef.current.value = "";
    },
    onError: (error: any) => showError(`Import failed: ${error.message}`),
    onSettled: () => (managementProps as any).setIsImporting(false),
  });

  const addSubCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, name }: { categoryId: string; name: string }) => {
      if (!user?.id) throw new Error("User not logged in.");
      await dataProvider.ensureSubCategoryExists(name.trim(), categoryId, user.id);
    },
    onSuccess: async () => {
      showSuccess("Sub-category added successfully!");
      await invalidateAllData();
    },
    onError: (error: any) => showError(`Failed to add sub-category: ${error.message}`),
  });

  const renameSubCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, categoryName, oldSubCategoryName, newSubCategoryName }: { categoryId: string; categoryName: string; oldSubCategoryName: string; newSubCategoryName: string }) => {
      if (!user?.id) throw new Error("User not logged in.");

      // Pragmatic fix: use db directly for complex updates not in provider interface yet
      await db.sub_categories
        .where({ category_id: categoryId, name: oldSubCategoryName })
        .modify({ name: newSubCategoryName.trim() });

      await db.transactions
        .where({ category: categoryName, sub_category: oldSubCategoryName })
        .modify({ sub_category: newSubCategoryName.trim() });
    },
    onSuccess: async () => {
      showSuccess("Sub-category renamed successfully!");
      await invalidateAllData();
    },
    onError: (error: any) => showError(`Failed to rename sub-category: ${error.message}`),
  });

  const deleteSubCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, categoryName, subCategoryName }: { categoryId: string; categoryName: string; subCategoryName: string }) => {
      if (!user?.id) throw new Error("User not logged in.");

      // Pragmatic fix: use db directly
      await db.sub_categories
        .where({ category_id: categoryId, name: subCategoryName })
        .delete();

      await db.transactions
        .where({ category: categoryName, sub_category: subCategoryName })
        .modify({ sub_category: null });
    },
    onSuccess: async () => {
      showSuccess("Sub-category deleted successfully!");
      await invalidateAllData();
    },
    onError: (error: any) => showError(`Failed to delete sub-category: ${error.message}`),
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
    addSubCategoryMutation,
    renameSubCategoryMutation,
    deleteSubCategoryMutation,
    isLoadingMutation: addCategoryMutation.isPending || managementProps.deleteMutation.isPending || batchUpsertCategoriesMutation.isPending || renameSubCategoryMutation.isPending || deleteSubCategoryMutation.isPending || addSubCategoryMutation.isPending,
  };
};