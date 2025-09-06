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
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { showError, showSuccess } from "@/utils/toast";
import AddEditPayeeDialog, { Payee } from "@/components/AddEditPayeeDialog";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { PlusCircle, Trash2, Edit } from "lucide-react";

const VendorsPage = () => { // Renamed component
  const [vendors, setVendors] = React.useState<Payee[]>([]); // Renamed state
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedVendor, setSelectedVendor] = React.useState<Payee | null>(null); // Renamed state
  
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [vendorToDelete, setVendorToDelete] = React.useState<Payee | null>(null); // Renamed state

  const { formatCurrency } = useCurrency();

  const fetchVendors = React.useCallback(async () => { // Renamed function
    setIsLoading(true);
    const { data, error } = await supabase.from("vendors_with_balance").select("*");

    if (error) {
      showError(`Failed to fetch vendors: ${error.message}`); // Updated message
      setVendors([]); // Renamed state
    } else {
      setVendors(data as Payee[]); // Renamed state
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchVendors(); // Renamed function
  }, [fetchVendors]);

  const filteredVendors = React.useMemo(() => { // Renamed variable
    return vendors.filter((p) => // Renamed state
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vendors, searchTerm]); // Renamed state

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage); // Renamed variable
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendors = filteredVendors.slice(startIndex, endIndex); // Renamed variable

  const handleAddClick = () => {
    setSelectedVendor(null); // Renamed state
    setIsDialogOpen(true);
  };

  const handleEditClick = (vendor: Payee) => { // Renamed parameter
    setSelectedVendor(vendor); // Renamed state
    setIsDialogOpen(true);
  };
  
  const handleDeleteClick = (vendor: Payee) => { // Renamed parameter
    setVendorToDelete(vendor); // Renamed state
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!vendorToDelete) return; // Renamed state
    try {
      const { error } = await supabase.rpc('delete_vendor_and_update_transactions', {
        p_vendor_id: vendorToDelete.id, // Renamed state
      });
      if (error) throw error;
      showSuccess("Vendor deleted successfully."); // Updated message
      fetchVendors(); // Renamed function
    } catch (error: any) {
      showError(`Failed to delete vendor: ${error.message}`); // Updated message
    } finally {
      setIsConfirmOpen(false);
      setVendorToDelete(null); // Renamed state
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Vendors</h2> {/* Updated title */}
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Vendor {/* Updated button text */}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Vendors & Accounts</CardTitle>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : currentVendors.length === 0 ? ( // Renamed variable
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No vendors found. {/* Updated message */}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentVendors.map((vendor) => ( // Renamed variable and parameter
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>
                        <Badge variant={vendor.is_account ? "default" : "secondary"}>
                          {vendor.is_account ? "Account" : "Vendor"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {vendor.is_account ? formatCurrency(vendor.running_balance || 0, vendor.currency || 'USD') : "-"}
                      </TableCell>
                      <TableCell>{vendor.is_account ? vendor.currency : "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(vendor)}> {/* Renamed parameter */}
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(vendor)}> {/* Renamed parameter */}
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredVendors.length)} of {filteredVendors.length} vendors {/* Updated message */}
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
        payee={selectedVendor} // Renamed state
        onSuccess={fetchVendors} // Renamed function
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDelete}
        title={`Delete ${vendorToDelete?.name}?`} {/* Renamed state */}
        description="This will permanently delete the vendor and may affect related transactions. This action cannot be undone." {/* Updated message */}
        confirmText="Delete"
      />
    </div>
  );
};

export default VendorsPage; // Renamed export