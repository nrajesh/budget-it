import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import { useCurrency } from "@/contexts/CurrencyContext";
import AddEditPayeeDialog, { Payee } from "@/components/AddEditPayeeDialog";
import { ColumnDefinition } from "@/components/management/EntityTable";
import EntityManagementPage from "@/components/management/EntityManagementPage";
import AccountReconciliationDialog from "@/components/management/AccountReconciliationDialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

import { filterAccounts } from "@/utils/nlp-search";

const AccountsPage = () => {
  const { accounts, isLoadingAccounts, invalidateAllData } = useTransactions();
  const { formatCurrency } = useCurrency();
  const managementProps = usePayeeManagement(true);
  const [isReconcileOpen, setIsReconcileOpen] = React.useState(false);

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
      accessor: (item) => formatCurrency(item.starting_balance || 0, item.currency || undefined),
    },
    {
      header: "Running Balance",
      accessor: (item) => formatCurrency(item.running_balance || 0, item.currency || undefined),
    },
    { header: "Remarks", accessor: "remarks" },
    {
      header: "Transactions",
      accessor: "totalTransactions",
      cellRenderer: (item) => (
        <span className="text-sm font-medium">
          {item.totalTransactions || 0}
        </span>
      ),
    },
  ];

  return (
    <>
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
        customFilter={(data, term) => filterAccounts(data, term) as Payee[]}
        extraActions={
          <Button onClick={() => setIsReconcileOpen(true)} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reconcile
          </Button>
        }
      />
      <AccountReconciliationDialog
        isOpen={isReconcileOpen}
        onClose={() => setIsReconcileOpen(false)}
      />
    </>
  );
};

export default AccountsPage;