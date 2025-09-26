import * as React from "react";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import { useCurrency } from "@/contexts/CurrencyContext";
import { AddEditPayeeDialog, Payee } from "@/components/AddEditPayeeDialog";
import { ColumnDefinition } from "@/components/management/EntityTable";
import { EntityManagementPage } from "@/components/management/EntityManagementPage";

const Accounts = () => {
  const { formatCurrency } = useCurrency();
  const managementProps = usePayeeManagement({
    entityType: "account",
    refetchQueries: ["accounts"],
  });

  const {
    accounts,
    isLoading: isLoadingAccounts,
    handleEdit,
  } = managementProps;

  const columns: ColumnDefinition<Payee>[] = React.useMemo(() => [
    { accessor: "name", header: "Name" },
    {
      accessor: "running_balance",
      header: "Running Balance",
      render: (item) => formatCurrency(item.running_balance || 0, item.currency),
    },
    {
      accessor: "totalTransactions",
      header: "Total Transactions",
      render: (item) => item.totalTransactions?.toString() || "0",
    },
    {
      accessor: "actions",
      header: "Actions",
      render: (item) => (
        <button onClick={() => handleEdit(item)} className="text-blue-500 hover:underline">
          Edit
        </button>
      ),
    },
  ], [formatCurrency, handleEdit]);

  return (
    <EntityManagementPage
      title="Accounts"
      entityName="Account"
      entityNamePlural="accounts"
      data={accounts}
      isLoading={isLoadingAccounts}
      columns={columns}
      managementProps={managementProps}
    />
  );
};

export default Accounts;