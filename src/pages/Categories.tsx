import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategoryManagement, Category } from '@/hooks/useCategoryManagement';
import { DataTable, CustomColumnDef } from '@/components/DataTable';
import { EntityManagementPage } from '@/components/management/EntityManagementPage';
import { AddEditCategoryDialog } from '@/components/AddEditCategoryDialog';

const Categories: React.FC = () => {
  const managementProps = useCategoryManagement();

  const columns: CustomColumnDef<Category>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
          className="h-4 w-4"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(event) => row.toggleSelected(event.target.checked)}
          className="h-4 w-4"
        />
      ),
    },
    {
      id: 'name',
      header: 'Category Name',
      cellRenderer: (item) => (
        <div onClick={() => managementProps.handleCategoryNameClick(item)} className="cursor-pointer font-medium hover:text-primary hover:underline">
          {item.name}
        </div>
      ),
    },
    {
      id: 'total_transactions',
      header: 'Transactions',
      cellRenderer: (item) => item.total_transactions,
    },
  ];

  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      await managementProps.addCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  return (
    <EntityManagementPage<Category> // Specify generic type
      title="Manage Categories"
      addPlaceholder="New category name"
      onAdd={managementProps.addCategory}
      isLoading={managementProps.isLoading}
      data={managementProps.categories}
      columns={columns}
      onDelete={managementProps.deleteCategories}
      isAccountContext={false}
      isCategoryContext={true} // Indicate this is for categories
      selectedEntity={managementProps.selectedCategory}
      isDialogOpen={managementProps.isDialogOpen}
      setIsDialogOpen={managementProps.setIsDialogOpen}
      handleEntityNameClick={managementProps.handleCategoryNameClick}
      onSave={managementProps.updateCategory}
    />
  );
};

export default Categories;