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

const AccountsPage = () => {
  const [accounts, setAccounts] = React.useState<Payee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState<Payee | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [accountToDelete, setAccountToDelete] = React.useState<Payee | null>(null);

  const { formatCurrency } = useCurrency();

  const fetchAccounts = React.useCallback(async () => {
    setIsLoading(true);
    // Fetch only accounts (is_account = true)
    const { data, error } = await supabase.from("vendors_with_balance").select("*").eq('is_account', true);

    if (error) {
      showError(`Failed to fetch accounts: ${error.message}`);
      setAccounts([]);
    } else {
      setAccounts(data as Payee[]);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const filteredAccounts = React.useMemo(() => {
    return accounts.filter((acc) =>
      acc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAccounts = filteredAccounts.slice(startIndex, endIndex);

  const handleAddClick = () => {
    setSelectedAccount(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (account: Payee) => {
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };
  
  const handleDeleteClick = (account: Payee) => {
    setAccountToDelete(account);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      // Use the same RPC function as it handles vendor deletion and transaction updates
      const { error } = await supabase.rpc('delete_vendor_and_update_transactions', {
        p_vendor_id: accountToDelete.id,
      });
      if (error) throw error;
      showSuccess("Account deleted successfully.");
      fetchAccounts();
    } catch (error: any) {
      showError(`Failed to delete account: ${error.message}`);
    } finally {
      setIsConfirmOpen(false);
      setAccountToDelete(null);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Accounts</CardTitle>
          <div className="mt-4">
            <Input
              placeholder="Search by account name..."
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
                  <TableHead>Account Name</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Starting Balance</TableHead>
                  <TableHead>Running Balance</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : currentAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{account.currency || "-"}</TableCell>
                      <TableCell>{formatCurrency(account.starting_balance || 0, account.currency || 'USD')}</TableCell>
                      <TableCell>{formatCurrency(account.running_balance || 0, account.currency || 'USD')}</TableCell>
                      <TableCell>{account.remarks || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(account)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(account)}>
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredAccounts.length)} of {filteredAccounts.length} accounts
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
        payee={selectedAccount}
        onSuccess={fetchAccounts}
        isAccountOnly={true} // Indicate that this dialog is for accounts only
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDelete}
        title={`Delete ${accountToDelete?.name}?`}
        description="This will permanently delete the account and may affect related transactions. This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

export default AccountsPage;