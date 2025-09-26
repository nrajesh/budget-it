import * as React from "react";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import { Payee, ColumnDefinition } from "@/types";
import EntityManagementPage from "@/components/management/EntityManagementPage";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

const Accounts = () => {
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = React.useState("");
  const { payees: accounts, isLoading: isLoadingAccounts, handleEdit, deletePayees } = usePayeeManagement({
    entityType: "account",
  });

  const columns: ColumnDefinition<Payee>[] = React.useMemo(() => [
    { accessor: "name", header: "Name" },
    {
      accessor: "running_balance",
      header: "Balance",
      render: (item) => formatCurrency(item.running_balance ?? 0),
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
  ], [formatCurrency, handleEdit, deletePayees]);

  const filteredAccounts = accounts.filter(acc => acc.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <EntityManagementPage
      title="Accounts"
      data={filteredAccounts}
      columns={columns}
      isLoading={isLoadingAccounts}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
    />
  );
};

export default Accounts;