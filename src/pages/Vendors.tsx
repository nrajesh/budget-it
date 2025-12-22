import React from 'react';
import { usePayeeManagement } from '@/hooks/usePayeeManagement';
import { Payee } from '@/types/payee';
import { CustomColumnDef } from '@/components/DataTable';
import { useCurrency } from '@/hooks/useCurrency';
import EntityManagementPage from '@/components/management/EntityManagementPage';

const Vendors: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const managementProps = usePayeeManagement(false); // Pass false for vendors

  const columns: CustomColumnDef<Payee>[] = [
    {
      id: 'name',
      header: 'Vendor Name',
      cellRenderer: (item) => (
        <div
          onClick={() => managementProps.handlePayeeNameClick(item)}
          className="cursor-pointer font-medium hover:text-primary hover:underline"
        >
          {item.name}
        </div>
      ),
    },
    // ... other column definitions
  ];

  return (
    <EntityManagementPage
      title="Manage Vendors"
      addPlaceholder="New vendor name"
      onAdd={managementProps.addPayee}
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