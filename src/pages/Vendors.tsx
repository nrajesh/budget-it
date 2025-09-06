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
import { useCurrency } from "@/contexts/CurrencyContext";
import { showError, showSuccess } from "@/utils/toast";
import AddEditPayeeDialog, { Payee } from "@/components/AddEditPayeeDialog";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { PlusCircle, Trash2, Edit, Loader2 } from "lucide-react"; // Import Loader2

const VendorsPage = () => {
  const [vendors, setVendors] = React.useState<Payee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedVendor, setSelectedVendor] = React.useState<Payee | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [vendorToDelete, setVendorToDelete] = React.useState<Payee | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);

  const [editingVendorId, setEditingVendorId] = React.useState<string | null>(null);
  const [editedName, setEditedName] = React.useState<string>("");
  const [isSavingName, setIsSavingName] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { formatCurrency, convertAmount } = useCurrency();

  const fetchVendors = React.useCallback(async () => {
    setIsLoading(true);
    const { data: vendorsData, error } = await supabase
      .from("vendors_with_balance")
      .select("*")
      .eq('is_account', false)
      .order('name', { ascending: true }); // Order by name

    if (error) {
      showError(`Failed to fetch vendors: ${error.message}`);
      setVendors([]);
    } else {
      const vendorsWithTransactions = await Promise.all(
        vendorsData.map(async (vendor) => {
          const { data: transactionsSumData, error: sumError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('vendor', vendor.name);

          if (sumError) {
            console.error(`Error fetching transaction sum for ${vendor.name}:`, sumError.message);
            return { ...vendor, totalTransactions: 0 };
          }

          const totalAmount = transactionsSumData.reduce((sum, t) => sum + t.amount, 0);
          return { ...vendor, totalTransactions: convertAmount(totalAmount) };
        })
      );
      setVendors(vendorsWithTransactions as Payee[]);
    }
    setIsLoading(false);
    setSelectedRows([]);
  }, [convertAmount]);

  React.useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filteredVendors = React.useMemo(() => {
    return vendors.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vendors, searchTerm]);

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);

  const handleAddClick = () => {
    setSelectedVendor(null);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (vendor: Payee) => {
    setVendorToDelete(vendor);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!vendorToDelete && selectedRows.length === 0) return;

    const idsToDelete = vendorToDelete ? [vendorToDelete.id] : selectedRows;
    const successMessage = vendorToDelete ? "Vendor deleted successfully." : `${selectedRows.length} items deleted successfully.`;

    try {
      const { error } = await supabase.rpc('delete_payees_batch', {
        p_vendor_ids: idsToDelete,
      });
      if (error) throw error;
      showSuccess(successMessage);
      fetchVendors();
    } catch (error: any) {
      showError(`Failed to delete: ${error.message}`);
    } finally {
      setIsConfirmOpen(false);
      setVendorToDelete(null);
      setSelectedRows([]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(currentVendors.map((v) => v.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows((prev) => [...prev, id]);
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
    }
  };

  const startEditing = (vendor: Payee) => {
    setEditingVendorId(vendor.id);
    setEditedName(vendor.name);
    // Use a timeout to ensure the input is rendered before focusing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSaveName = async (vendorId: string, originalName: string) => {
    if (editedName.trim() === "" || editedName === originalName) {
      setEditingVendorId(null);
      return;
    }

    setIsSavingName(true);
    try {
      const { error } = await supabase.rpc('update_vendor_name', {
        p_vendor_id: vendorId,
        p_new_name: editedName.trim(),
      });
      if (error) throw error;
      showSuccess("Vendor name updated successfully!");
      fetchVendors(); // Re-fetch to update the list and transaction sums
    } catch (error: any) {
      showError(`Failed to update vendor name: ${error.message}`);
    } finally {
      setIsSavingName(false);
      setEditingVendorId(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, vendor: Payee) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur(); // Trigger onBlur to save
    } else if (event.key === 'Escape') {
      setEditingVendorId(null); // Cancel editing
    }
  };

  const numSelected = selectedRows.length;
  const rowCount = currentVendors.length;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Vendors</h2>
        <div className="flex items-center space-x-2">
          {numSelected > 0 && (
            <Button variant="destructive" onClick={() => setIsConfirmOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({numSelected})
            </Button>
          )}
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Vendor
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Vendors</CardTitle>
          <div className="mt-4">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={rowCount > 0 && numSelected === rowCount}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Total Transactions</TableHead> {/* Renamed column */}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Loading...</TableCell> {/* Adjusted colSpan */}
                  </TableRow>
                ) : currentVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground"> {/* Adjusted colSpan */}
                      No vendors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentVendors.map((vendor) => (
                    <TableRow key={vendor.id} data-state={selectedRows.includes(vendor.id) && "selected"}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(vendor.id)}
                          onCheckedChange={(checked) => handleRowSelect(vendor.id, Boolean(checked))}
                          aria-label="Select row"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {editingVendorId === vendor.id ? (
                          <Input
                            ref={inputRef}
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={() => handleSaveName(vendor.id, vendor.name)}
                            onKeyDown={(e) => handleKeyDown(e, vendor)}
                            disabled={isSavingName}
                            className="h-8"
                          />
                        ) : (
                          <div onClick={() => startEditing(vendor)} className="cursor-pointer hover:text-primary">
                            {vendor.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(vendor.totalTransactions || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isSavingName && editingVendorId === vendor.id ? (
                          <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(vendor)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
            {numSelected > 0
              ? `${numSelected} of ${filteredVendors.length} row(s) selected.`
              : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredVendors.length)} of ${filteredVendors.length} vendors`}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
      <AddEditPayeeDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        payee={selectedVendor}
        onSuccess={fetchVendors}
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDelete}
        title="Are you sure?"
        description="This will permanently delete the selected item(s) and may affect related transactions. This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

export default VendorsPage;