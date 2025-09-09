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
import { PlusCircle, Trash2, Edit, Loader2, RotateCcw, Upload, Download } from "lucide-react";
import { useTransactions } from "@/contexts/TransactionsContext"; // Import useTransactions
import Papa from "papaparse";
import LoadingOverlay from "@/components/LoadingOverlay"; // Import LoadingOverlay
import { useNavigate } from "react-router-dom"; // Import useNavigate

const VendorsPage = () => {
  const { vendors, fetchVendors, refetchAllPayees, fetchTransactions } = useTransactions(); // Use vendors, fetchVendors, refetchAllPayees, and fetchTransactions from context
  const [isLoading, setIsLoading] = React.useState(true); // Keep local loading for initial fetch
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
  const [isRefreshing, setIsRefreshing] = React.useState(false); // New state for refresh loading
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const navigate = useNavigate(); // Initialize useNavigate

  // Initial fetch for vendors
  React.useEffect(() => {
    const loadVendors = async () => {
      setIsLoading(true);
      await fetchVendors();
      setIsLoading(false);
    };
    loadVendors();
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
      refetchAllPayees(); // Re-fetch all payees after deletion
      fetchTransactions(); // Re-fetch transactions to update any affected entries
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
      refetchAllPayees(); // Re-fetch all payees to update the list
      fetchTransactions(); // Re-fetch transactions to update any affected entries
    } catch (error: any) {
      showError(`Failed to update vendor name: ${error.message}`);
    } finally {
      setIsSavingName(false);
      setEditingVendorId(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, vendor: Payee) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      setEditingVendorId(null);
    }
  };

  // New function to handle vendor name click
  const handleVendorNameClick = (vendorName: string) => {
    // Navigate to Transactions page with vendor filter
    navigate('/transactions', {
      state: {
        filterVendor: vendorName,
      }
    });
  };

  const numSelected = selectedRows.length;
  const rowCount = currentVendors.length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVendors();
    setIsRefreshing(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const requiredHeaders = ["Vendor Name"];
        const actualHeaders = results.meta.fields || [];
        const hasAllHeaders = requiredHeaders.every(h => actualHeaders.includes(h));

        if (!hasAllHeaders) {
          showError(`CSV is missing required header: "Vendor Name"`);
          setIsImporting(false);
          return;
        }

        const vendorNames = results.data.map((row: any) => row["Vendor Name"]).filter(Boolean);

        if (vendorNames.length === 0) {
          showError("No valid vendor names found in the CSV file.");
          setIsImporting(false);
          return;
        }

        try {
          const { error } = await supabase.rpc('batch_upsert_vendors', {
            p_names: vendorNames,
          });

          if (error) throw error;

          showSuccess(`${vendorNames.length} vendors imported successfully!`);
          await refetchAllPayees();
        } catch (error: any) {
          showError(`Import failed: ${error.message}`);
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      },
      error: (error: any) => {
        showError(`CSV parsing error: ${error.message}`);
        setIsImporting(false);
      },
    });
  };

  const handleExportClick = () => {
    if (vendors.length === 0) {
      showError("No vendors to export.");
      return;
    }

    const dataToExport = vendors.map(v => ({
      "Vendor Name": v.name,
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "vendors_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-4">
      <LoadingOverlay isLoading={isImporting || isRefreshing} message={isImporting ? "Importing vendors..." : "Refreshing vendors..."} />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Vendors</h2>
        <div className="flex items-center space-x-2">
          {numSelected > 0 && (
            <Button variant="destructive" onClick={() => setIsConfirmOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({numSelected})
            </Button>
          )}
          <Button onClick={handleImportClick} variant="outline" disabled={isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import CSV
          </Button>
          <Button onClick={handleExportClick} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Vendor
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            <span className="sr-only">Refresh Vendors</span>
          </Button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".csv"
      />
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : currentVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
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
                          <div
                            onClick={() => handleVendorNameClick(vendor.name)}
                            className="cursor-pointer hover:text-primary hover:underline"
                          >
                            {vendor.name}
                          </div>
                        )}
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
        onSuccess={refetchAllPayees} // Call refetchAllPayees on success
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