import React from 'react';
import { usePayeeManagement, Payee } from '@/hooks/usePayeeManagement';
import { CustomColumnDef } from '@/components/DataTable';
import { useCurrency } from '@/hooks/useCurrency';
import { EntityManagementPage } from '@/components/management/EntityManagementPage'; // Correct named import

const ManageAccounts: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const managementProps = usePayeeManagement(true); // Pass true for accounts

  const columns: CustomColumnDef<Payee>[] = [
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
      header: 'Account Name',
      cellRenderer: (item) => (
        <div onClick={() => managementProps.handlePayeeNameClick(item)} className="cursor-pointer font-medium hover:text-primary hover:underline">
          {item.name}
        </div>
      ),
    },
    {
      id: 'currency',
      header: 'Currency',
      cellRenderer: (item) => item.currency,
    },
    {
      id: 'starting_balance',
      header: 'Starting Balance',
      cellRenderer: (item) => formatCurrency(item.starting_balance || 0, item.currency || 'USD'),
    },
    {
      id: 'running_balance',
      header: 'Current Balance',
      cellRenderer: (item) => formatCurrency(item.running_balance || 0, item.currency || 'USD'),
    },
    {
      id: 'total_transactions',
      header: 'Transactions',
      cellRenderer: (item) => item.total_transactions,
    },
    {
      id: 'remarks',
      header: 'Remarks',
      cellRenderer: (item) => item.remarks,
    },
  ];

  return (
    <EntityManagementPage<Payee> // Specify generic type
      title="Manage Accounts"
      addPlaceholder="New account name"
      onAdd={managementProps.addPayee}
      onFileChange={managementProps.handleFileChange}
      isImporting={managementProps.isImporting}
      isLoading={managementProps.isLoading}
      data={managementProps.payees}
      columns={columns}
      onDelete={managementProps.deletePayees}
      isAccountContext={true}
      selectedEntity={managementProps.selectedPayee}
      isDialogOpen={managementProps.isDialogOpen}
      setIsDialogOpen={managementProps.setIsDialogOpen}
      handleEntityNameClick={managementProps.handlePayeeNameClick}
      onSave={managementProps.updatePayee}
    />
  );
};

export default ManageAccounts;