import React from 'react';
import { Category } from '@/types/category';
import EntityManagementPage from '@/components/management/EntityManagementPage';
import { ColumnDefinition } from '@/components/management/EntityTable';
import { useCategoryManagement } from '@/hooks/useCategoryManagement';

const CategoriesPage: React.FC = () => {
  const managementProps = useCategoryManagement();

  const columns: ColumnDefinition<Category>[] = [
    {
      header: "Category Name",
      accessor: (item) => (
        <div onClick={() => managementProps.handleCategoryNameClick(item.name)} className="cursor-pointer hover:text-primary hover:underline">
          {item.name}
        </div>
      ),
    },
    {
      header: "Transactions",
      accessor: (item) => item.total_transactions?.toString() || '0',
    },
  ];

  return (
    <EntityManagementPage<Category>
      title="Categories"
      entityName="Category"
      entityNamePlural="Categories"
      data={managementProps.categories}
      isLoading={managementProps.isLoadingCategories}
      columns={columns}
      AddEditDialogComponent={() => <div>Add/Edit Category Dialog</div>}
      isDeletable={(item) => item.name !== 'Others'}
      selectedEntity={managementProps.selectedEntity}
      handleAddClick={managementProps.handleAddClick}
      handleEditClick={managementProps.handleEditClick}
      handleDeleteClick={managementProps.handleDeleteClick}
      confirmDelete={() => managementProps.deleteMutation.mutate([managementProps.selectedEntity?.id || ''])}
      handleBulkDeleteClick={managementProps.handleBulkDeleteClick}
      handleSelectAll={managementProps.handleSelectAll}
      handleRowSelect={managementProps.handleRowSelect}
      handleImportClick={managementProps.handleImportClick}
      handleExportClick={() => {}}
      searchTerm={managementProps.searchTerm}
      setSearchTerm={managementProps.setSearchTerm}
      currentPage={managementProps.currentPage}
      setCurrentPage={managementProps.setCurrentPage}
      itemsPerPage={managementProps.itemsPerPage}
      setItemsPerPage={managementProps.setItemsPerPage}
      sortConfig={managementProps.sortConfig}
      setSortConfig={managementProps.setSortConfig}
      refetch={managementProps.refetchCategories}
    />
  );
};

export default CategoriesPage;