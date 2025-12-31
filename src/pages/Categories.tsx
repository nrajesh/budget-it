import React, { useState, useMemo } from 'react';
import { ColumnDefinition } from '@/components/management/EntityTable';
import EntityManagementPage from '@/components/management/EntityManagementPage';
import { Category } from '@/types/database';
import { useCategories } from '@/hooks/useCategories';
import CategoryTransactionsDialog from '@/components/CategoryTransactionsDialog'; // Import the new component

// Placeholder components
const AddEditCategoryDialog = () => null; 

interface CategoryManagementProps {
  handleCategoryNameClick: (name: string) => void;
}

const CategoriesPage: React.FC = () => {
  const { categories, isLoading, refetch } = useCategories();
  
  // State for EntityManagementPage
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Category; direction: 'asc' | 'desc' } | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Category | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isTransactionsDialogOpen, setIsTransactionsDialogOpen] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  // --- Handlers ---
  const handleAddClick = () => setSelectedEntity(null);
  const handleEditClick = (category: Category) => setSelectedEntity(category);
  const handleDeleteClick = (category: Category | null) => setSelectedEntity(category);
  const confirmDelete = () => { /* Delete logic */ setSelectedEntity(null); };
  const handleBulkDeleteClick = () => console.log("Bulk delete categories:", selectedIds);
  const handleSelectAll = (ids: string[]) => setSelectedIds(ids);
  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id));
  };
  const handleImport = (file: File) => console.log("Import categories:", file.name);
  const handleExportClick = () => console.log("Export categories");

  const handleCategoryNameClick = (name: string) => {
    setSelectedCategoryName(name);
    setIsTransactionsDialogOpen(true);
  };

  const managementProps: CategoryManagementProps = {
    handleCategoryNameClick,
  };

  // --- Columns Definition ---
  const columns: ColumnDefinition<Category>[] = useMemo(() => [
    {
      key: 'name',
      header: "Category Name",
      render: (item) => (
        <div onClick={() => managementProps.handleCategoryNameClick(item.name)} className="cursor-pointer hover:text-primary hover:underline font-medium">
          {item.name}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'total_transactions',
      header: "Transactions",
      render: (item) => item.total_transactions?.toString() || '0',
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
    },
  ], [managementProps]);

  // Simple client-side filtering/sorting/pagination logic (placeholder)
  const filteredData = useMemo(() => {
    let filtered = categories;
    // ... filtering and sorting logic based on state ...
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [categories, searchTerm, sortConfig, currentPage, itemsPerPage]);


  return (
    <>
      <EntityManagementPage<Category>
        title="Category Management"
        entityName="Category"
        entityNamePlural="Categories"
        data={filteredData}
        isLoading={isLoading}
        columns={columns}
        AddEditDialogComponent={AddEditCategoryDialog}
        selectedEntity={selectedEntity}
        handleAddClick={handleAddClick}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        confirmDelete={confirmDelete}
        handleBulkDeleteClick={handleBulkDeleteClick}
        handleSelectAll={handleSelectAll}
        handleRowSelect={handleRowSelect}
        handleImport={handleImport}
        handleExportClick={handleExportClick}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        refetch={refetch}
      />
      <CategoryTransactionsDialog 
        isOpen={isTransactionsDialogOpen} 
        onClose={() => setIsTransactionsDialogOpen(false)} 
        categoryName={selectedCategoryName} 
      />
    </>
  );
};

export default CategoriesPage;