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
} from "@/components/ui/pagination";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDown, FileUp, Plus, Trash2, Edit, RotateCcw } from "lucide-react";
import { useVendors, Vendor } from "@/contexts/VendorsContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import AddVendorDialog from "@/components/AddVendorDialog";
import EditVendorDialog from "@/components/EditVendorDialog";

const ITEMS_PER_PAGE = 10;

const VendorsPage = () => {
  const { vendors, isLoading, deleteVendors, exportVendorsToCsv, importVendorsFromCsv } = useVendors();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedVendorIds, setSelectedVendorIds] = React.useState<string[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredVendors = React.useMemo(() => {
    return vendors.filter(vendor =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vendors, searchTerm]);

  const totalPages = Math.ceil(filteredVendors.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVendorIds(currentVendors.map(vendor => vendor.id));
    } else {
      setSelectedVendorIds([]);
    }
  };

  const handleSelectVendor = (vendorId: string, checked: boolean) => {
    if (checked) {
      setSelectedVendorIds(prev => [...prev, vendorId]);
    } else {
      setSelectedVendorIds(prev => prev.filter(id => id !== vendorId));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedVendorIds.length > 0) {
      setIsDeleteConfirmOpen(true);
    }
  };

  const confirmDelete = async () => {
    await deleteVendors(selectedVendorIds);
    setSelectedVendorIds([]);
    setIsDeleteConfirmOpen(false);
  };

  const handleEditClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsEditDialogOpen(true);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await importVendorsFromCsv(file);
      event.target.value = ''; // Clear the input
    }
  };

  // Reset pagination and selections when filters change
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedVendorIds([]);
  }, [searchTerm, filteredVendors.length]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Vendors</h2>
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Manage Vendors</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 items-end">
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm w-full"
              />
              <Button onClick={() => setIsAddDialogOpen(true)} className="shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Button>
              <Button
                variant="outline"
                onClick={exportVendorsToCsv}
                className="shrink-0"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".csv"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
              >
                <FileUp className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={selectedVendorIds.length === 0}
                className="shrink-0"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedVendorIds.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedVendorIds.length === currentVendors.length && currentVendors.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No vendors found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedVendorIds.includes(vendor.id)}
                            onCheckedChange={(checked) => handleSelectVendor(vendor.id, checked as boolean)}
                            aria-label={`Select vendor ${vendor.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>{new Date(vendor.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(vendor)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit vendor</span>
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
            <span className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredVendors.length)} of {filteredVendors.length} vendors
            </span>
            <Pagination>
              <PaginationContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        </Card>

        <AddVendorDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
        {selectedVendor && (
          <EditVendorDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            vendor={selectedVendor}
          />
        )}
        <ConfirmationDialog
          isOpen={isDeleteConfirmOpen}
          onOpenChange={setIsDeleteConfirmOpen}
          onConfirm={confirmDelete}
          title={`Are you sure you want to delete ${selectedVendorIds.length} vendor(s)?`}
          description="This action cannot be undone. This will permanently delete the selected vendors."
          confirmText="Delete"
        />
      </div>
    </div>
  );
};

export default VendorsPage;