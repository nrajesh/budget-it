import React from 'react';
import { ManagementPage } from '@/components/management/ManagementPage';
import { ColumnDefinition } from '@/components/management/EntityTable';
import { Category } from '@/types/finance';
import { useCategoryManagement } from '@/hooks/useCategoryManagement';
import { AddEditCategoryDialog } from '@/components/categories/AddEditCategoryDialog';

const CategoriesPage = () => {
  const managementProps = useCategoryManagement();

  const columns: ColumnDefinition<Category>[] = [
    { accessorKey: 'name', header: 'Category Name' },
    { accessorKey: 'total_transactions', header: 'Transactions' },
  ];

  return (
    <>
      <ManagementPage
        title="Categories"
        description="Manage your spending categories."
        columns={columns}
        data={managementProps.categories}
        onAdd={managementProps.handleAdd}
        onEdit={managementProps.handleEdit}
        onDelete={managementProps.handleDelete}
        onImport={managementProps.handleImport}
      />
      <AddEditCategoryDialog
        open={managementProps.isDialogOpen}
        onOpenChange={managementProps.setIsDialogOpen}
        category={managementProps.editingCategory}
        onSave={managementProps.handleSave}
      />
    </>
  );
};

export default CategoriesPage;