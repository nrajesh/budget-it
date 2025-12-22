import React from 'react';
import { useCategoryManagement } from '@/hooks/useCategoryManagement';
import { Category } from '@/types/category';
import { CustomColumnDef } from '@/components/DataTable';
import EntityManagementPage from '@/components/management/EntityManagementPage';

const Categories: React.FC = () => {
  const managementProps = useCategoryManagement();

  const columns: CustomColumnDef<Category>[] = [
    {
      id: 'name',
      header: 'Category Name',
      cellRenderer: (item) => (
        <div
          onClick={() => managementProps.handleCategoryNameClick(item)}
          className="cursor-pointer font-medium hover:text-primary hover:underline"
        >
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

  return (
    <EntityManagementPage<Category>
      title="Categories"
      addPlaceholder="New category name"
      onAdd={managementProps.addCategory}
      isLoading={managementProps.isLoading}
      data={managementProps.categories}
      columns={columns}
      onDelete={managementProps.deleteCategories}
      isAccountContext={false}
      selectedEntity={managementProps.selectedCategory}
      isDialogOpen={managementProps.isDialogOpen}
      setIsDialogOpen={managementProps.setIsDialogOpen}
      handleEntityNameClick={managementProps.handleCategoryNameClick}
      onSave={managementProps.updateCategory}
    />
  );
};

export default Categories;