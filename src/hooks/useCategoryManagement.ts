"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Papa from "papaparse";
import { useUser } from "./useUser";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Category } from "@/contexts/TransactionsContext"; // Import Category type

export const useCategoryManagement = () => {
  const { user } = useUser();
  const { categories, isLoadingCategories, refetchCategories, invalidateAllData } = useTransactions();
  const queryClient = useQueryClient();

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("User not authenticated.");
      const { data, error } = await supabase
        .from("categories")
        .insert({ name, user_id: user.id })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateAllData();
      toast.success("Category added successfully.");
    },
    onError: (error) => {
      toast.error("Failed to add category.");
      console.error("Add category error:", error);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update({ name })
        .eq("id", id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateAllData();
      toast.success("Category updated successfully.");
    },
    onError: (error) => {
      toast.error("Failed to update category.");
      console.error("Update category error:", error);
    },
  });

  const deleteCategoriesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.rpc("delete_categories_batch", { p_vendor_ids: ids });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateAllData();
      toast.success("Categories deleted successfully.");
    },
    onError: (error) => {
      toast.error("Failed to delete categories.");
      console.error("Delete categories error:", error);
    },
  });

  const addCategory = async (name: string) => {
    await addCategoryMutation.mutateAsync(name);
  };

  const updateCategory = async (id: string, name: string) => {
    await updateCategoryMutation.mutateAsync({ id, name });
  };

  const deleteCategories = async (ids: string[]) => {
    await deleteCategoriesMutation.mutateAsync(ids);
  };

  const exportCategoriesToCsv = () => {
    if (!categories || categories.length === 0) {
      toast.info("No categories to export.");
      return;
    }
    const dataToExport = categories.map((cat) => ({ "Category Name": cat.name }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "categories.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Categories exported successfully.");
  };

  const importCategoriesFromCsv = useMutation({
    mutationFn: async (file: File) => {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            if (!user) {
              toast.error("User not authenticated.");
              return reject("User not authenticated.");
            }
            const categoriesToInsert = results.data.map((row: any) => ({
              name: row["Category Name"],
              user_id: user.id,
            }));

            const { data, error } = await supabase
              .from("categories")
              .insert(categoriesToInsert)
              .select();
            if (error) return reject(error);
            resolve(data);
          },
          error: (error: any) => {
            reject(error);
          },
        });
      });
    },
    onSuccess: () => {
      invalidateAllData();
      toast.success("Categories imported successfully.");
    },
    onError: (error) => {
      toast.error("Failed to import categories.");
      console.error("Import categories error:", error);
    },
  });

  return {
    categories,
    isLoadingCategories,
    addCategory,
    updateCategory,
    deleteCategories,
    exportCategoriesToCsv,
    importCategoriesFromCsv: importCategoriesFromCsv.mutateAsync,
    isAddingCategory: addCategoryMutation.isPending,
    isUpdatingCategory: updateCategoryMutation.isPending,
    isDeletingCategories: deleteCategoriesMutation.isPending,
    isImportingCategories: importCategoriesFromCsv.isPending,
    refetchCategories,
  };
};