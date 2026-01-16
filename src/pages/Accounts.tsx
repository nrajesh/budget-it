import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import { useCurrency } from "@/contexts/CurrencyContext";
import AddEditPayeeDialog, { Payee } from "@/components/AddEditPayeeDialog";
import { ColumnDefinition } from "@/components/management/EntityTable";
import EntityManagementPage from "@/components/management/EntityManagementPage";
import AccountDeduplicationDialog from "@/components/management/AccountDeduplicationDialog";
import AccountBalanceReconciliationDialog from "@/components/management/AccountBalanceReconciliationDialog";

import { filterAccounts } from "@/utils/nlp-search";

import { GroupedEntityTable } from "@/components/management/GroupedEntityTable";

const AccountsPage = () => {
  const { accounts, isLoadingAccounts, invalidateAllData } = useTransactions();
  const { formatCurrency } = useCurrency();
  const managementProps = usePayeeManagement(true);

  // Sort accounts by type for grouping
  const sortedAccounts = React.useMemo(() => {
    return [...accounts].sort((a, b) => {
      const typeA = a.type || 'Other';
      const typeB = b.type || 'Other';
      if (typeA < typeB) return -1;
      if (typeA > typeB) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [accounts]);

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
    { header: "Type", accessor: (item) => item.type || 'Checking' }, // Default for legacy data
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
        data={sortedAccounts}
        isLoading={isLoadingAccounts}
        columns={columns}
        AddEditDialogComponent={(props) => (
          <AddEditPayeeDialog {...props} onSuccess={invalidateAllData} isAccountOnly={true} />
        )}
        // Pass all management props explicitly
        {...managementProps}
        selectedEntity={managementProps.selectedPayee}
        customFilter={(data, term) => filterAccounts(data, term) as Payee[]}
        DeduplicationDialogComponent={AccountDeduplicationDialog}
        BalanceReconciliationDialogComponent={AccountBalanceReconciliationDialog}
        groupBy="type"
        TableComponent={GroupedEntityTable}
        disablePagination={true}
      />
    </>
  );
};

export default AccountsPage;