import * as React from "react";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import { AddEditPayeeDialog, Payee } from "@/components/AddEditPayeeDialog";
import { ColumnDefinition } from "@/components/management/EntityTable";
import { EntityManagementPage } from "@/components/management/EntityManagementPage";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const Vendors = () => {
  const queryClient = useQueryClient();
  const managementProps = usePayeeManagement({
    entityType: "vendor",
    refetchQueries: ["vendors"],
  });

  const {
    vendors,
    isLoading: isLoadingVendors,
    handleEdit,
  } = managementProps;

  const [editableNames, setEditableNames] = React.useState<Record<string, string>>({});

  const updateVendorNameMutation = useMutation({
    mutationFn: async ({ vendorId, newName }: { vendorId: string; newName: string }) => {
      const { error } = await supabase.rpc('update_vendor_name', { p_vendor_id: vendorId, p_new_name: newName });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Vendor name updated successfully.");
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      showError(`Failed to update vendor name: ${error.message}`);
    },
  });

  const handleNameChange = (id: string, value: string) => {
    setEditableNames(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveName = (id: string, currentName: string) => {
    const newName = editableNames[id];
    if (newName && newName !== currentName) {
      updateVendorNameMutation.mutate({ vendorId: id, newName });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, item: Payee) => {
    if (e.key === 'Enter') {
      handleSaveName(item.id, item.name);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setEditableNames(prev => ({ ...prev, [item.id]: item.name }));
      (e.target as HTMLInputElement).blur();
    }
  };

  const columns: ColumnDefinition<Payee>[] = React.useMemo(() => [
    {
      accessor: "name",
      header: "Name",
      render: (item) => (
        <Input
          value={editableNames[item.id] ?? item.name}
          onChange={(e) => handleNameChange(item.id, e.target.value)}
          onBlur={() => handleSaveName(item.id, item.name)}
          onKeyDown={(e) => handleKeyDown(e, item)}
          disabled={updateVendorNameMutation.isPending}
          className="h-8"
        />
      ),
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
  ], [editableNames, handleEdit, updateVendorNameMutation.isPending]);

  return (
    <EntityManagementPage
      title="Vendors"
      entityName="Vendor"
      entityNamePlural="vendors"
      data={vendors}
      isLoading={isLoadingVendors}
      columns={columns}
      managementProps={managementProps}
    />
  );
};

export default Vendors;