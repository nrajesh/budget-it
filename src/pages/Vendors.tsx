import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import AddEditPayeeDialog from "@/components/AddEditPayeeDialog";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { PlusCircle, Trash2, Loader2, RotateCcw, Upload, Download, Pencil } from "lucide-react";
import { useTransactions } from "@/contexts/TransactionsContext";
import LoadingOverlay from "@/components/LoadingOverlay";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import { useMutation } from '@tanstack/react-query';

const VendorsPage = () => {
  const { vendors, isLoadingVendors, refetchVendors, invalidateAllData } = useTransactions();
  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage, itemsPerPage,
    isDialogOpen, setIsDialogOpen, selectedPayee,
    isConfirmOpen, setIsConfirmOpen,
    selectedRows,
    isImporting, fileInputRef,
    deletePayeesMutation,
    handleAddClick, handleEditClick, handleDeleteClick, confirmDelete, handleBulkDeleteClick,
    handleSelectAll, handleRowSelect,
    handleImportClick, handleFileChange, handleExportClick,
    handlePayeeNameClick,
  } = usePayeeManagement(false);

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

  const filteredVendors = React.useMemo(() => {
    return vendors.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [vendors, searchTerm]);

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);

  const numSelected = selectedRows.length;
  const rowCount = currentVendors.length;

  return (
    <div className="flex-1 space-y-4">
      <LoadingOverlay isLoading={isLoadingVendors || isImporting || deletePayeesMutation.isPending || updateVendorNameMutation.isPending} message={isImporting ? "Importing vendors..." : "Loading vendors..."} />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Vendors</h2>
        <div className="flex items-center space-x-2">
          {numSelected > 0 && (
            <Button variant="destructive" onClick={handleBulkDeleteClick} disabled={deletePayeesMutation.isPending}>
              {deletePayeesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete ({numSelected})
            </Button>
          )}
          <Button onClick={handleImportClick} variant="outline" disabled={isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import CSV
          </Button>
          <Button onClick={() => handleExportClick(vendors)} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Vendor
          </Button>
          <Button variant="outline" size="icon" onClick={async () => await refetchVendors()} disabled={isLoadingVendors}>
            {isLoadingVendors ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            <span className="sr-only">Refresh Vendors</span>
          </Button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
      <Card>
        <CardHeader>
          <CardTitle>Manage Vendors</CardTitle>
          <div className="mt-4">
            <Input placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox checked={rowCount > 0 && numSelected === rowCount} onCheckedChange={(checked) => handleSelectAll(Boolean(checked), currentVendors)} aria-label="Select all" />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingVendors ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                ) : currentVendors.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No vendors found.</TableCell></TableRow>
                ) : (
                  currentVendors.map((vendor) => (
                    <TableRow key={vendor.id} data-state={selectedRows.includes(vendor.id) && "selected"}>
                      <TableCell>
                        <Checkbox checked={selectedRows.includes(vendor.id)} onCheckedChange={(checked) => handleRowSelect(vendor.id, Boolean(checked))} aria-label="Select row" />
                      </TableCell>
                      <TableCell className="font-medium">
                        {editingVendorId === vendor.id ? (
                          <Input ref={inputRef} value={editedName} onChange={(e) => setEditedName(e.target.value)} onBlur={() => handleSaveName(vendor.id, vendor.name)} onKeyDown={(e) => handleKeyDown(e, vendor)} disabled={updateVendorNameMutation.isPending} className="h-8" />
                        ) : (
                          <div onClick={() => handlePayeeNameClick(vendor.name)} className="cursor-pointer hover:text-primary hover:underline">{vendor.name}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {updateVendorNameMutation.isPending && editingVendorId === vendor.id ? (
                          <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => startEditing(vendor)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(vendor)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {numSelected > 0 ? `${numSelected} of ${filteredVendors.length} row(s) selected.` : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredVendors.length)} of ${filteredVendors.length} vendors`}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} /></PaginationItem>
              <PaginationItem><PaginationNext onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
      <AddEditPayeeDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} payee={selectedPayee} onSuccess={async () => await invalidateAllData()} />
      <ConfirmationDialog isOpen={isConfirmOpen} onOpenChange={setIsConfirmOpen} onConfirm={confirmDelete} title="Are you sure?" description="This will permanently delete the selected item(s) and may affect related transactions. This action cannot be undone." confirmText="Delete" />
    </div>
  );
};

export default VendorsPage;