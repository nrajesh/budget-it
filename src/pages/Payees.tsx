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

const PayeesPage = () => {
  const [payees, setPayees] = React.useState<Payee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedPayee, setSelectedPayee] = React.useState<Payee | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [payeeToDelete, setPayeeToDelete] = React.useState<Payee | null>(null);

  const { formatCurrency } = useCurrency();

  const fetchPayees = React.useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("vendors_with_balance").select("*");

    if (error) {
      showError(`Failed to fetch payees: ${error.message}`);
      setPayees([]);
    } else {
      setPayees(data as Payee[]);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchPayees();
  }, [fetchPayees]);

  const filteredPayees = React.useMemo(() => {
    return payees.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [payees, searchTerm]);

  const totalPages = Math.ceil(filteredPayees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayees = filteredPayees.slice(startIndex, endIndex);

  const handleAddClick = () => {
    setSelectedPayee(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (payee: Payee) => {
    setSelectedPayee(payee);
    setIsDialogOpen(true);
  };
  
  const handleDeleteClick = (payee: Payee) => {
    setPayeeToDelete(payee);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!payeeToDelete) return;
    try {
      const { error } = await supabase.rpc('delete_vendor_and_update_transactions', {
        p_vendor_id: payeeToDelete.id,
      });
      if (error) throw error;
      showSuccess("Payee deleted successfully.");
      fetchPayees();
    } catch (error: any) {
      showError(`Failed to delete payee: ${error.message}`);
    } finally {
      setIsConfirmOpen(false);
      setPayeeToDelete(null);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Payees</h2>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Payee
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
                ) : currentPayees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No payees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPayees.map((payee) => (
                    <TableRow key={payee.id}>
                      <TableCell className="font-medium">{payee.name}</TableCell>
                      <TableCell>
                        <Badge variant={payee.is_account ? "default" : "secondary"}>
                          {payee.is_account ? "Account" : "Vendor"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payee.is_account ? formatCurrency(payee.running_balance || 0, payee.currency || 'USD') : "-"}
                      </TableCell>
                      <TableCell>{payee.is_account ? payee.currency : "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(payee)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(payee)}>
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredPayees.length)} of {filteredPayees.length} payees
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
        payee={selectedPayee}
        onSuccess={fetchPayees}
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDelete}
        title={`Delete ${payeeToDelete?.name}?`}
        description="This will permanently delete the payee and may affect related transactions. This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

export default PayeesPage;