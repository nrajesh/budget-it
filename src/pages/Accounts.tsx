import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { Payee } from '@/types/payee';
import EntityManagementPage from '@/components/management/EntityManagementPage';
import { ColumnDefinition } from '@/components/management/EntityTable';
import { useEntityManagement } from '@/hooks/useEntityManagement';
import { useCurrency } from '@/hooks/useCurrency';

const AccountsPage: React.FC = () => {
  const { accounts, isLoadingAccounts } = useTransactions();
  const { formatCurrency } = useCurrency();
  
  const managementProps = useEntityManagement<Payee>({
    data: accounts,
    entityName: "Account",
    entityNamePlural: "Accounts",
    queryKey: ["accounts"],
  });

  const columns: ColumnDefinition<Payee>[] = [
    {
      header: "Account Name",
      accessor: (item) => item.name,
    },
    {
      header: "Currency",
      accessor: (item) => item.currency || 'N/A',
    },
    {
      header: "Balance",
      accessor: (item) => formatCurrency(item.running_balance || 0, item.currency),
    },
    {
      header: "Transactions",
      accessor: (item) => item.total_transactions?.toString() || '0',
    },
  ];

  const confirmDelete = () => {
    managementProps.setIsConfirmOpen(false);
  };

  const AddEditAccountDialog = (props: any) => <div>Add/Edit Account Dialog Content</div>;

  const handleImportClick = () => {
    console.log("Import clicked");
  };

  const handleExportClick = (items: Payee[]) => {
    const dataToExport = items.length > 0 ? items : [
      { 
        name: 'Sample Bank Account', 
        currency: 'USD', 
        starting_balance: 1000.00, 
        remarks: 'My primary savings account' 
      } as any
    ];

    const headers = ['Name', 'Currency', 'Starting Balance', 'Remarks'];
    const csvRows = dataToExport.map(item => [
      `"${item.name || ''}"`,
      `"${item.currency || 'USD'}"`,
      item.starting_balance || 0,
      `"${item.remarks || ''}"`
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', items.length > 0 ? 'accounts_export.csv' : 'accounts_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <EntityManagementPage
      title="Accounts"
      entityName="Account"
      entityNamePlural="Accounts"
      data={managementProps.paginatedData}
      isLoading={isLoadingAccounts}
      columns={columns}
      AddEditDialogComponent={AddEditAccountDialog}
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

export default AccountsPage;