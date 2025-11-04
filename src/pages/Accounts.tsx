import React from "react";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import { useCurrency } from "@/contexts/CurrencyContext";
import { AddEditPayeeDialog } from "@/components/AddEditPayeeDialog";
import { ColumnDefinition } from "@/components/management/EntityTable";
import { ManagementPage } from "@/components/management/ManagementPage";
import { Payee } from "@/types/finance";

const Accounts: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const payeeManagement = usePayeeManagement(true);

  const columns: ColumnDefinition<Payee>[] = [
    { accessorKey: "name", header: "Account Name" },
    {
      accessorKey: "running_balance",
      header: "Balance",
      cell: ({ row }) => formatCurrency(row.original.running_balance ?? 0, row.original.currency ?? 'USD'),
    },
    { accessorKey: "total_transactions", header: "Transactions" },
    { accessorKey: "remarks", header: "Remarks" },
  ];

  return (
    <>
      <ManagementPage
        title="Accounts"
        description="Manage your bank accounts, credit cards, and other assets."
        columns={columns}
        data={payeeManagement.data}
        onAdd={payeeManagement.handleAdd}
        onEdit={payeeManagement.handleEdit}
        onDelete={payeeManagement.handleDelete}
        onImport={payeeManagement.handleImport}
      />
      <AddEditPayeeDialog
        open={payeeManagement.isDialogOpen}
        onOpenChange={payeeManagement.setIsDialogOpen}
        payee={payeeManagement.selectedPayee}
        isAccount={true}
        onSave={payeeManagement.handleSave}
      />
    </>
  );
};

export default Accounts;