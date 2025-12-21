import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePayeeManagement, Payee } from '@/hooks/usePayeeManagement';
import { DataTable, ColumnDefinition } from '@/components/DataTable'; // Correct import
import { useCurrency } from '@/hooks/useCurrency'; // Correct import
import { AddEditVendorDialog } from '@/components/AddEditVendorDialog'; // Correct import

const Vendors: React.FC = () => {
  const { formatCurrency } = useCurrency(); // Keep useCurrency for consistency, though not directly used in vendor table
  const managementProps = usePayeeManagement(false); // Pass false for vendors

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

  const [newVendorName, setNewVendorName] = useState('');

  const handleAddVendor = async () => {
    if (newVendorName.trim()) {
      await managementProps.addPayee(newVendorName.trim());
      setNewVendorName('');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Vendors</h1>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="New vendor name"
          value={newVendorName}
          onChange={(e) => setNewVendorName(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAddVendor}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Vendor
        </Button>
      </div>

      <DataTable
        data={managementProps.payees}
        isLoading={managementProps.isLoading}
        columns={columns}
        onDelete={(selectedIds) => managementProps.deletePayees(selectedIds)}
      />

      <AddEditVendorDialog
        open={managementProps.isDialogOpen}
        onOpenChange={managementProps.setIsDialogOpen}
        selectedEntity={managementProps.selectedPayee}
        onSave={managementProps.updatePayee}
        onAdd={managementProps.addPayee}
      />
    </div>
  );
};

export default Vendors;