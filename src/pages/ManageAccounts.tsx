import React, { useState } from 'react';
import { PlusCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePayeeManagement, Payee } from '@/hooks/usePayeeManagement';
import { DataTable, ColumnDefinition } from '@/components/DataTable'; // Correct import
import { useCurrency } from '@/hooks/useCurrency'; // Correct import
import { AddEditAccountDialog } from '@/components/AddEditAccountDialog'; // Correct import

const ManageAccounts: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const managementProps = usePayeeManagement(true); // Pass true for accounts

  const columns: ColumnDefinition<Payee>[] = [
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

  const [newAccountName, setNewAccountName] = useState('');

  const handleAddAccount = async () => {
    if (newAccountName.trim()) {
      await managementProps.addPayee(newAccountName.trim(), 'USD', 0, ''); // Default values for new account
      setNewAccountName('');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Accounts</h1>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="New account name"
          value={newAccountName}
          onChange={(e) => setNewAccountName(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAddAccount}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Account
        </Button>
        <Input
          type="file"
          accept=".csv"
          onChange={managementProps.handleFileChange}
          className="hidden"
          id="account-csv-upload"
        />
        <label htmlFor="account-csv-upload">
          <Button asChild variant="outline" disabled={managementProps.isImporting}>
            <span>
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </span>
          </Button>
        </label>
        {managementProps.isImporting && <p>Importing...</p>}
      </div>

      <DataTable
        data={managementProps.payees}
        isLoading={managementProps.isLoading}
        columns={columns}
        onDelete={(selectedIds) => managementProps.deletePayees(selectedIds)}
      />

      <AddEditAccountDialog
        open={managementProps.isDialogOpen}
        onOpenChange={managementProps.setIsDialogOpen}
        selectedEntity={managementProps.selectedPayee}
        onSave={managementProps.updatePayee}
        onAdd={managementProps.addPayee}
      />
    </div>
  );
};

export default ManageAccounts;