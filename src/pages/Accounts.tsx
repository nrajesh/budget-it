import React from 'react';
import { Payee } from '@/types/payee';
import EntityManagementPage from '@/components/management/EntityManagementPage';
import { ColumnDefinition } from '@/components/management/EntityTable';
import { usePayeeManagement } from '@/hooks/usePayeeManagement';

const AccountsPage: React.FC = () => {
  const managementProps = usePayeeManagement(true);

  const columns: ColumnDefinition<Payee>[] = [
    {
      header: "Account Name",
      accessor: (item) => (
        <div onClick={() => managementProps.handlePayeeNameClick(item.name)} className="cursor-pointer hover:text-primary hover:underline font-medium">
          {item.name}
        </div>
      ),
    },
    {
      header: "Currency",
      accessor: (item) => item.currency || 'USD',
    },
    {
      header: "Balance",
      accessor: (item) => item.running_balance?.toFixed(2) || '0.00',
    },
  ];

  return (
    <EntityManagementPage<Payee>
      title="Accounts"
      entityName="Account"
      entityNamePlural="Accounts"
      data={managementProps.paginatedData}
      isLoading={managementProps.isLoading}
      columns={columns}
      AddEditDialogComponent={() => <div>Add/Edit Account Dialog</div>}
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

export default AccountsPage;