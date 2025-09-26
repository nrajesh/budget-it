import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import AddEditPayeeDialog, { Payee } from "@/components/AddEditPayeeDialog";
import { ColumnDefinition } from "@/components/management/EntityTable";
import EntityManagementPage from "@/components/management/EntityManagementPage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2 } from "lucide-react";
import { useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const VendorsPage = () => {
  const { vendors, isLoadingVendors, invalidateAllData } = useTransactions();
  const managementProps = usePayeeManagement(false);

  const [editingVendorId, setEditingVendorId] = React.useState<string | null>(null);
  const [editedName, setEditedName] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const updateVendorNameMutation = useMutation({
    mutationFn: async ({ vendorId, newName }: { vendorId: string; newName: string }) => {
      const { error } = await supabase.rpc('update_vendor_name', { p_vendor_id: vendorId, p_new_name: newName });
      if (error) throw error;
    },
    onSuccess: async () => {
      showSuccess("Vendor name updated successfully!");
      await invalidateAllData();
      setEditingVendorId(null);
    },
    onError: (error: any) => showError(`Failed to update vendor name: ${error.message}`),
  });

  const startEditing = (vendor: { id: string; name: string }) => {
    setEditingVendorId(vendor.id);
    setEditedName(vendor.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSaveName = (vendorId: string, originalName: string) => {
    if (editedName.trim() === "" || editedName === originalName) {
      setEditingVendorId(null);
      return;
    }
    updateVendorNameMutation.mutate({ vendorId, newName: editedName.trim() });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, vendor: { id: string; name: string }) => {
    if (event.key === 'Enter') event.currentTarget.blur();
    else if (event.key === 'Escape') setEditingVendorId(null);
  };

  const columns: ColumnDefinition<Payee>[] = [
    {
      header: "Name",
      accessor: "name",
      cellRenderer: (item) =>
        editingVendorId === item.id ? (
          <Input
            ref={inputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={() => handleSaveName(item.id, item.name)}
            onKeyDown={(e) => handleKeyDown(e, item)}
            disabled={updateVendorNameMutation.isPending}
            className="h-8"
          />
        ) : (
          <div onClick={() => managementProps.handlePayeeNameClick(item.name)} className="cursor-pointer hover:text-primary hover:underline">
            {item.name}
          </div>
        ),
    },
  ];

  return (
    <EntityManagementPage
      title="Vendors"
      entityName="Vendor"
      entityNamePlural="vendors"
      data={vendors}
      isLoading={isLoadingVendors}
      columns={columns}
      managementProps={managementProps}
      AddEditDialogComponent={(props) => (
        <AddEditPayeeDialog {...props} onSuccess={invalidateAllData} />
      )}
      isDeletable={(item) => item.name !== 'Others'}
      isEditable={(item) => item.name !== 'Others'}
      customEditHandler={startEditing}
      isEditing={id => editingVendorId === id}
      isUpdating={updateVendorNameMutation.isPending}
    />
  );
};

export default VendorsPage;