import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { Payee } from '@/types/payee';
import EntityManagementPage from '@/components/management/EntityManagementPage';
import { ColumnDefinition } from '@/components/management/EntityTable';
import { useEntityManagement } from '@/hooks/useEntityManagement';

const VendorsPage: React.FC = () => {
  const { vendors, isLoadingVendors } = useTransactions();
  const managementProps = useEntityManagement<Payee>(vendors);

  const columns: ColumnDefinition<Payee>[] = [
    {
      key: "name",
      header: "Vendor Name",
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

  const AddEditVendorDialog = (props: any) => <div>Add/Edit Vendor Dialog Content</div>;

  return (
    <EntityManagementPage
      title="Vendors"
      entityName="Vendor"
      entityNamePlural="Vendors"
      data={managementProps.paginatedData}
      isLoading={isLoadingVendors}
      columns={columns}
      AddEditDialogComponent={AddEditVendorDialog}
      selectedEntity={managementProps.selectedEntity}
      handleAddClick={managementProps.handleAddClick}
      handleEditClick={managementProps.handleEditClick}
      handleDeleteClick={managementProps.handleDeleteClick}
      confirmDelete={confirmDelete}
      isDeletable={() => true}
      isEditable={() => true}
      handleBulkDeleteClick={managementProps.handleBulkDeleteClick}
      handleSelectAll={managementProps.handleSelectAll}
      handleRowSelect={managementProps.handleRowSelect}
      handleImportClick={() => {}}
      handleExportClick={() => {}}
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

export default VendorsPage;