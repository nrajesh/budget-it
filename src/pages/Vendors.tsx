import React from 'react';
import { Payee } from '@/types/payee';
import EntityManagementPage from '@/components/management/EntityManagementPage';
import { ColumnDefinition } from '@/components/management/EntityTable';
import { usePayeeManagement } from '@/hooks/usePayeeManagement';

const VendorsPage: React.FC = () => {
  const managementProps = usePayeeManagement(false);

  const columns: ColumnDefinition<Payee>[] = [
    {
      header: "Vendor Name",
      accessor: (item) => (
        <div onClick={() => managementProps.handlePayeeNameClick(item.name)} className="cursor-pointer hover:text-primary hover:underline font-medium">
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
    <EntityManagementPage
      title="Vendors"
      entityName="Vendor"
      entityNamePlural="Vendors"
      data={managementProps.paginatedData}
      isLoading={managementProps.isLoading}
      columns={columns}
      AddEditDialogComponent={() => <div>Add/Edit Vendor Dialog</div>}
      selectedEntity={managementProps.selectedEntity}
      handleAddClick={managementProps.handleAddClick}
      handleEditClick={managementProps.handleEditClick}
      handleDeleteClick={managementProps.handleDeleteClick}
      confirmDelete={() => managementProps.deleteMutation.mutate([managementProps.selectedEntity?.id || ''])}
      handleBulkDeleteClick={managementProps.handleBulkDeleteClick}
      handleSelectAll={managementProps.handleSelectAll}
      handleRowSelect={managementProps.handleRowSelect}
      handleImport={managementProps.handleImport}
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