import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types/category';
import { useCategoryManagement } from '@/hooks/useCategoryManagement';
import EntityManagementPage from '@/components/management/EntityManagementPage';
import { ColumnDefinition } from '@/components/management/EntityTable';

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

  const handleAddClick = () => {};
  const handleEditClick = (item: Category) => {};
  const handleDeleteClick = (item: Category) => {};
  const confirmDelete = () => {};
  const handleBulkDeleteClick = () => {};
  const handleSelectAll = (checked: boolean, currentItems: Category[]) => {};
  const handleRowSelect = (id: string, checked: boolean) => {};
  const handleImportClick = () => {};
  const handleExportClick = (items: Category[]) => {};

  return (
    <EntityManagementPage<Category>
      title="Categories"
      entityName="Category"
      entityNamePlural="Categories"
      data={categories || []}
      isLoading={isLoadingCategories}
      columns={columns}
      AddEditDialogComponent={() => <div>Edit Dialog Content</div>}
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