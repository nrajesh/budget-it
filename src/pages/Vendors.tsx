import React from "react";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import { AddEditPayeeDialog } from "@/components/AddEditPayeeDialog";
import { ColumnDefinition } from "@/components/management/EntityTable";
import { ManagementPage } from "@/components/management/ManagementPage";
import { Payee } from "@/types/finance";

const Vendors: React.FC = () => {
  const payeeManagement = usePayeeManagement(false);

  const columns: ColumnDefinition<Payee>[] = [
    { accessorKey: "name", header: "Vendor Name" },
    { accessorKey: "total_transactions", header: "Transactions" },
  ];

  return (
    <>
      <ManagementPage
        title="Payees"
        description="Manage your vendors and payees."
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
        isAccount={false}
        onSave={payeeManagement.handleSave}
      />
    </>
  );
};

export default Vendors;