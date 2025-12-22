import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/category";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import EntityManagementPage from "@/components/management/EntityManagementPage";
import { ColumnDefinition } from "@/components/management/EntityTable";

const CategoriesPage: React.FC = () => {
  const managementProps = useCategoryManagement();

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_categories_with_transaction_counts', {
        user_id_param: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) throw error;
      return data;
    },
  });

  const columns: ColumnDefinition<Category>[] = [
    {
      key: "name",
      header: "Name",
      accessor: (item) => item.name,
      cellRenderer: (item) => (
        <div onClick={() => managementProps.handleCategoryNameClick(item.name)} className="cursor-pointer hover:text-primary hover:underline">
          {item.name}
        </div>
      ),
    },
    {
      key: "total_transactions",
      header: "Transactions",
      accessor: (item) => item.total_transactions?.toString() || '0',
    },
  ];

  // Add missing management props
  const handleAddClick = () => {
    // Handle add click
  };

  const handleEditClick = (item: Category) => {
    // Handle edit click
  };

  const handleDeleteClick = (item: Category) => {
    // Handle delete click
  };

  const confirmDelete = () => {
    // Confirm delete
  };

  const handleBulkDeleteClick = () => {
    // Handle bulk delete click
  };

  const handleSelectAll = (checked: boolean, currentItems: Category[]) => {
    // Handle select all
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    // Handle row select
  };

  const handleImportClick = () => {
    // Handle import click
  };

  const handleExportClick = (items: Category[]) => {
    // Handle export click
  };

  return (
    <EntityManagementPage<Category>
      title="Categories"
      entityName="Category"
      entityNamePlural="Categories"
      data={categories || []}
      isLoading={isLoadingCategories}
      columns={columns}
      AddEditDialogComponent={(props) => (
        <div>Edit Dialog Content</div>
      )}
      {...managementProps}
      selectedEntity={managementProps.selectedEntity}
      handleAddClick={handleAddClick}
      handleEditClick={handleEditClick}
      handleDeleteClick={handleDeleteClick}
      confirmDelete={confirmDelete}
      isDeletable={() => true}
      isEditable={() => true}
      handleBulkDeleteClick={handleBulkDeleteClick}
      handleSelectAll={handleSelectAll}
      handleRowSelect={handleRowSelect}
      handleImportClick={handleImportClick}
      handleExportClick={handleExportClick}
    />
  );
};

export default CategoriesPage;