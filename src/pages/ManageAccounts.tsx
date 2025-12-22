import React from 'react';
import { usePayeeManagement } from '@/hooks/usePayeeManagement';
import { Payee } from '@/types/payee';
import { CustomColumnDef } from '@/components/DataTable';
import { useCurrency } from '@/hooks/useCurrency';
import EntityManagementPage from '@/components/management/EntityManagementPage';

const ManageAccounts: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const managementProps = usePayeeManagement(true); // Pass true for accounts

  const columns: CustomColumnDef<Payee>[] = [
    // ... existing column definitions ...
  ];

  return (
    <EntityManagementPage<Payee>
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