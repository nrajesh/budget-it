import React from 'react';
import { usePayeeManagement } from '@/hooks/usePayeeManagement';
import { Payee } from '@/types/payee';
import { CustomColumnDef } from '@/components/DataTable';
import { useCurrency } from '@/hooks/useCurrency';
import EntityManagementPage from '@/components/management/EntityManagementPage';

const Accounts: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const managementProps = usePayeeManagement(true); // Pass true for accounts

  const columns: CustomColumnDef<Payee>[] = [
    {
      id: 'name',
      header: 'Account Name',
      cellRenderer: (item) => (
        <div
          onClick={() => managementProps.handlePayeeNameClick(item)}
          className="cursor-pointer font-medium hover:text-primary hover:underline"
        >
          {item.name}
        </div>
      ),
    },
    // Add other columns as needed
  ];

  return (
    <EntityManagementPage
      title="Accounts"
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

export default Accounts;