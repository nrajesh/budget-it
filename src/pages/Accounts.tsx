import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Payee } from "@/types/payee";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import EntityManagementPage from "@/components/management/EntityManagementPage";
import { useCurrency } from "@/hooks/useCurrency";
import { ColumnDefinition } from "@/components/management/EntityTable";

const AccountsPage: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const managementProps = usePayeeManagement({
    isAccount: true,
    onImportComplete: () => {
      // Handle import completion
    }
  });

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<Payee[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_accounts_with_transaction_counts');
      if (error) throw error;
      return data;
    },
  });

  const columns: ColumnDefinition<Payee>[] = [
    {
      key: 'name',
      header: 'Name',
      accessor: (item) => item.name,
      cellRenderer: (item) => (
        <div onClick={() => managementProps.handlePayeeNameClick(item.name)} className="cursor-pointer font-medium hover:text-primary hover:underline">
          {item.name}
        </div>
      ),
    },
    {
      key: 'currency',
      header: 'Currency',
      accessor: (item) => item.currency,
    },
    {
      key: 'starting_balance',
      header: 'Starting Balance',
      accessor: (item) => formatCurrency(item.starting_balance, item.currency),
    },
    {
      key: 'running_balance',
      header: 'Running Balance',
      accessor: (item) => formatCurrency(item.starting_balance, item.currency),
    },
    {
      key: 'total_transactions',
      header: 'Transactions',
      accessor: (item) => item.total_transactions?.toString() || '0',
    },
  ];

  // Add missing management props
  const handleAddClick = () => {
    // Handle add click
  };

  const handleEditClick = (item: Payee) => {
    // Handle edit click
  };

  const handleDeleteClick = (item: Payee) => {
    // Handle delete click
  };

  const confirmDelete = () => {
    // Confirm delete
  };

  const handleBulkDeleteClick = () => {
    // Handle bulk delete click
  };

  const handleSelectAll = (checked: boolean, currentItems: Payee[]) => {
    // Handle select all
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    // Handle row select
  };

  const handleImportClick = () => {
    // Handle import click
  };

  const handleExportClick = (items: Payee[]) => {
    // Handle export click
  };

  return (
    <EntityManagementPage<Payee>
      title="Accounts"
      entityName="Account"
      entityNamePlural="Accounts"
      data={accounts || []}
      isLoading={isLoadingAccounts}
      columns={columns}
      AddEditDialogComponent={(props) => (
        <div>Edit Dialog Content</div>
      )}
      {...managementProps}
      selectedEntity={managementProps.selectedEntity}
      handleAddClick={handleAddClick}
      handleEditClick={handleEditClick}
      handleDeleteClick={handleDeleteClick}
      confirmDelete={confirmDelete}
      isDeletable={() => true}
      isEditable={() => true}
      handleBulkDeleteClick={handleBulkDeleteClick}
      handleSelectAll={handleSelectAll}
      handleRowSelect={handleRowSelect}
      handleImportClick={handleImportClick}
      handleExportClick={handleExportClick}
    />
  );
};

export default AccountsPage;