import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import { useCurrency } from "@/contexts/CurrencyContext";
import AddEditPayeeDialog, { Payee } from "@/components/AddEditPayeeDialog";
import { ColumnDefinition } from "@/components/management/EntityTable";
import EntityManagementPage from "@/components/management/EntityManagementPage";

const AccountsPage = () => {
  const { accounts, isLoadingAccounts, invalidateAllData } = useTransactions();
  const { formatCurrency } = useCurrency();
  const managementProps = usePayeeManagement(true);

  const columns: ColumnDefinition<Payee>[] = [
    {
      header: "Account Name",
      accessor: "name",
      cellRenderer: (item) => (
        <div onClick={() => managementProps.handlePayeeNameClick(item.name)} className="cursor-pointer font-medium hover:text-primary hover:underline">
          {item.name}
        </div>
      ),
    },
    { header: "Currency", accessor: "currency" },
    {
      header: "Starting Balance",
      accessor: (item) => formatCurrency(item.starting_balance || 0, item.currency || 'USD'),
    },
    {
      header: "Running Balance",
      accessor: (item) => formatCurrency(item.running_balance || 0, item.currency || 'USD'),
    },
    { header: "Remarks", accessor: "remarks" },
  ];

  return (
    <EntityManagementPage
      title="Accounts"
      entityName="Account"
      entityNamePlural="accounts"
      data={accounts}
      isLoading={isLoadingAccounts}
      columns={columns}
      AddEditDialogComponent={(props) => (
        <AddEditPayeeDialog {...props} onSuccess={invalidateAllData} isAccountOnly={true} />
      )}
      // Pass all management props explicitly
      {...managementProps}
      selectedEntity={managementProps.selectedPayee}
    />
  );
};

export default AccountsPage;