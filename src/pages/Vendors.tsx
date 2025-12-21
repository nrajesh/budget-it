import React from 'react';
import { usePayeeManagement, Payee } from '@/hooks/usePayeeManagement';
import { CustomColumnDef } from '@/components/DataTable';
import { useCurrency } from '@/hooks/useCurrency';
import { EntityManagementPage } from '@/components/management/EntityManagementPage'; // Correct named import

const Vendors: React.FC = () => {
  const { formatCurrency } = useCurrency(); // Keep useCurrency for consistency, though not directly used in vendor table
  const managementProps = usePayeeManagement(false); // Pass false for vendors

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
      header: 'Vendor Name',
      cellRenderer: (item) => (
        <div onClick={() => managementProps.handlePayeeNameClick(item)} className="cursor-pointer font-medium hover:text-primary hover:underline">
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
    <EntityManagementPage<Payee> // Specify generic type
      title="Manage Vendors"
      addPlaceholder="New vendor name"
      onAdd={managementProps.addPayee}
      // No onFileChange for vendors as per previous decision
      isLoading={managementProps.isLoading}
      data={managementProps.payees}
      columns={columns}
      onDelete={managementProps.deletePayees}
      isAccountContext={false}
      selectedEntity={managementProps.selectedPayee}
      isDialogOpen={managementProps.isDialogOpen}
      setIsDialogOpen={managementProps.setIsDialogOpen}
      handleEntityNameClick={managementProps.handlePayeeNameClick}
      onSave={managementProps.updatePayee}
    />
  );
};

export default Vendors;