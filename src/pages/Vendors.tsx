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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { showError, showSuccess } from "@/utils/toast";
import AddEditPayeeDialog, { Payee } from "@/components/AddEditPayeeDialog";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { PlusCircle, Trash2, Edit } from "lucide-react";

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

  const { formatCurrency } = useCurrency();

  const fetchVendors = React.useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("vendors_with_balance").select("*").eq('is_account', false); // Filter for non-accounts

    if (error) {
      showError(`Failed to fetch vendors: ${error.message}`);
      setVendors([]);
    } else {
      setVendors(data as Payee[]);
    }
    setIsLoading(false);
    setSelectedRows([]);
  }, []);

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

  const handleEditClick = (vendor: Payee) => {
    setSelectedVendor(vendor);
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
          <CardTitle>Manage Vendors</CardTitle> {/* Updated title */}
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
                  {/* Removed Type column */}
                  <TableHead>Balance</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell> {/* Adjusted colSpan */}
                  </TableRow>
                ) : currentVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground"> {/* Adjusted colSpan */}
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
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      {/* Removed Type Cell */}
                      <TableCell>
                        {vendor.is_account ? formatCurrency(vendor.running_balance || 0, vendor.currency || 'USD') : "-"}
                      </TableCell>
                      <TableCell>{vendor.is_account ? vendor.currency : "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(vendor)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(vendor)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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