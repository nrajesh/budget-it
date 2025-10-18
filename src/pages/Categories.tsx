"use client";

import React, { useState } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload, Download, RefreshCcw } from "lucide-react";
import { CategoryTable } from "@/components/CategoryTable";
import { AddEditCategoryDialog } from "@/components/AddEditCategoryDialog";
import { ImportCategoriesDialog } from "@/components/ImportCategoriesDialog";
import { Category } from "@/contexts/TransactionsContext"; // Import Category type

const CategoriesPage = () => {
  const { invalidateAllData } = useTransactions();
  const managementProps = useCategoryManagement();
  const { categories, isLoadingCategories, refetchCategories, exportCategoriesToCsv, importCategoriesFromCsv } = managementProps;

  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

  const handleAddCategory = () => {
    setSelectedCategory(undefined);
    setIsAddEditDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsAddEditDialogOpen(true);
  };

  const handleRefresh = () => {
    refetchCategories();
    invalidateAllData();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Categories</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Categories</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
            <Button variant="outline" onClick={exportCategoriesToCsv}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddCategory}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>
        </div>

        <CategoryTable
          data={categories || []}
          isLoading={isLoadingCategories}
          onEdit={handleEditCategory}
          onDelete={managementProps.deleteCategories}
        />
      </div>

      <AddEditCategoryDialog
        isOpen={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        category={selectedCategory}
        onSave={selectedCategory ? managementProps.updateCategory : managementProps.addCategory}
        isSaving={selectedCategory ? managementProps.isUpdatingCategory : managementProps.isAddingCategory}
      />
      <ImportCategoriesDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={importCategoriesFromCsv}
        isImporting={managementProps.isImportingCategories}
      />
    </div>
  );
};

export default CategoriesPage;