import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Payee } from "@/types/payee";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import EntityManagementPage from "@/components/management/EntityManagementPage";
import { ColumnDefinition } from "@/components/management/EntityTable";

const VendorsPage: React.FC = () => {
  const managementProps = usePayeeManagement({
    isAccount: false,
    onImportComplete: () => {
      // Handle import completion
    }
  });

  const { data: vendors, isLoading: isLoadingVendors } = useQuery<Payee[]>({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vendors_with_transaction_counts');
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
        <div onClick={() => managementProps.handlePayeeNameClick(item.name)} className="cursor-pointer hover:text-primary hover:underline">
          {item.name}
        </div>
      ),
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
      title="Vendors"
      entityName="Vendor"
      entityNamePlural="Vendors"
      data={vendors || []}
      isLoading={isLoadingVendors}
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

export default VendorsPage;