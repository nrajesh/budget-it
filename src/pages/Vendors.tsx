import * as React from "react";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import { Payee, ColumnDefinition } from "@/types";
import EntityManagementPage from "@/components/management/EntityManagementPage";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

const Vendors = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { payees: vendors, isLoading: isLoadingVendors, handleEdit, deletePayees } = usePayeeManagement({
    entityType: "vendor",
  });

  const columns: ColumnDefinition<Payee>[] = React.useMemo(() => [
    {
      accessor: "name",
      header: "Name",
      render: (item) => (
        <div className="font-medium">{item.name}</div>
      ),
    },
    {
      accessor: "total_transactions",
      header: "Transactions",
    },
    {
      accessor: "actions",
      header: "Actions",
      render: (item) => (
        <div className="space-x-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(item.id, item.name); }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deletePayees([item.id]); }}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEdit, deletePayees]);

  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <EntityManagementPage
      title="Vendors"
      data={filteredVendors}
      columns={columns}
      isLoading={isLoadingVendors}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
    />
  );
};

export default Vendors;