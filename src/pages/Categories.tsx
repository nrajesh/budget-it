import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { Category } from '@/types/category';
import EntityManagementPage from '@/components/management/EntityManagementPage';
import { ColumnDefinition } from '@/components/management/EntityTable';
import { useEntityManagement } from '@/hooks/useEntityManagement';

const CategoriesPage: React.FC = () => {
  const { categories, isLoadingCategories, refetchCategories } = useTransactions();
  const managementProps = useEntityManagement<Category>(categories);

  const columns: ColumnDefinition<Category>[] = [
    {
      key: "name",
      header: "Category Name",
      accessor: (item) => item.name,
    },
    {
      key: "total_transactions",
      header: "Transactions",
      accessor: (item) => item.total_transactions?.toString() || '0',
    },
    // Add more columns as needed
  ];

  const confirmDelete = () => {
    // Placeholder for delete logic
    managementProps.setIsConfirmDeleteOpen(false);
  };

  const AddEditCategoryDialog = (props: any) => <div>Add/Edit Category Dialog Content</div>;

  const handleImportClick = () => {};
  const handleExportClick = (items: Category[]) => {};

  return (
    <EntityManagementPage
      title="Categories"
      entityName="Category"
      entityNamePlural="Categories"
      data={managementProps.paginatedData}
      isLoading={isLoadingCategories}
      columns={columns}
      AddEditDialogComponent={AddEditCategoryDialog}
      selectedEntity={managementProps.selectedEntity}
      handleAddClick={managementProps.handleAddClick}
      handleEditClick={managementProps.handleEditClick}
      handleDeleteClick={managementProps.handleDeleteClick}
      confirmDelete={confirmDelete}
      isDeletable={(category) => category.name !== 'Others'}
      isEditable={() => true}
      handleBulkDeleteClick={managementProps.handleBulkDeleteClick}
      handleSelectAll={managementProps.handleSelectAll}
      handleRowSelect={managementProps.handleRowSelect}
      handleImportClick={handleImportClick}
      handleExportClick={handleExportClick}
      searchTerm={managementProps.searchTerm}
      setSearchTerm={managementProps.setSearchTerm}
      currentPage={managementProps.currentPage}
      setCurrentPage={managementProps.setCurrentPage}
      itemsPerPage={managementProps.itemsPerPage}
      setItemsPerPage={managementProps.setItemsPerPage}
      sortConfig={managementProps.sortConfig}
      setSortConfig={managementProps.setSortConfig}
    />
  );
};

export default CategoriesPage;