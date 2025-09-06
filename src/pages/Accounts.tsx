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
import { PlusCircle, Trash2, Edit, Upload, Download } from "lucide-react";
import { useTransactions } from "@/contexts/TransactionsContext"; // Import useTransactions
import { RotateCcw, Loader2 } from "lucide-react"; // Import RotateCcw and Loader2 icons
import Papa from "papaparse";
import LoadingOverlay from "@/components/LoadingOverlay"; // Import LoadingOverlay

const AccountsPage = () => {
  const { accounts, fetchAccounts, refetchAllPayees, fetchTransactions } = useTransactions(); // Use accounts and fetchAccounts from context
  const [isLoading, setIsLoading] = React.useState(true); // Keep local loading for initial fetch
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState<Payee | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [accountToDelete, setAccountToDelete] = React.useState<Payee | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false); // New state for refresh loading
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { formatCurrency } = useCurrency();

  // Initial fetch for accounts
  React.useEffect(() => {
    const loadAccounts = async () => {
      setIsLoading(true);
      await fetchAccounts();
      setIsLoading(false);
    };
    loadAccounts();
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
    if (!accountToDelete && selectedRows.length === 0) return;
    
    const idsToDelete = accountToDelete ? [accountToDelete.id] : selectedRows;
    const successMessage = accountToDelete ? "Account deleted successfully." : `${selectedRows.length} accounts deleted successfully.`;

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
      setAccountToDelete(null);
      setSelectedRows([]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(currentAccounts.map((acc) => acc.id));
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
  const rowCount = currentAccounts.length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAccounts();
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
        const requiredHeaders = ["Account Name", "Currency", "Starting Balance", "Remarks"];
        const actualHeaders = results.meta.fields || [];
        const hasAllHeaders = requiredHeaders.every(h => actualHeaders.includes(h));

        if (!hasAllHeaders) {
          showError(`CSV is missing required headers: ${requiredHeaders.join(", ")}`);
          setIsImporting(false);
          return;
        }

        const accountsToUpsert = results.data.map((row: any) => ({
          name: row["Account Name"],
          currency: row["Currency"],
          starting_balance: parseFloat(row["Starting Balance"]) || 0,
          remarks: row["Remarks"],
        })).filter(acc => acc.name); // Filter out rows without an account name

        if (accountsToUpsert.length === 0) {
          showError("No valid account data found in the CSV file.");
          setIsImporting(false);
          return;
        }

        try {
          const { error } = await supabase.rpc('batch_upsert_accounts', {
            p_accounts: accountsToUpsert,
          });

          if (error) throw error;

          showSuccess(`${accountsToUpsert.length} accounts imported/updated successfully!`);
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
    if (accounts.length === 0) {
      showError("No accounts to export.");
      return;
    }

    const dataToExport = accounts.map(acc => ({
      "Account Name": acc.name,
      "Currency": acc.currency,
      "Starting Balance": acc.starting_balance,
      "Remarks": acc.remarks,
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "accounts_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <LoadingOverlay isLoading={isImporting || isRefreshing} message={isImporting ? "Importing accounts..." : "Refreshing accounts..."} />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
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
            <PlusCircle className="mr-2 h-4 w-4" /> Add Account
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
            <span className="sr-only">Refresh Accounts</span>
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
                  <TableHead>
                    <Checkbox
                      checked={rowCount > 0 && numSelected === rowCount}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      aria-label="Select all"
                    />
                  </TableHead>
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
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : currentAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentAccounts.map((account) => (
                    <TableRow key={account.id} data-state={selectedRows.includes(account.id) && "selected"} onDoubleClick={() => handleEditClick(account)}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(account.id)}
                          onCheckedChange={(checked) => handleRowSelect(account.id, Boolean(checked))}
                          aria-label="Select row"
                        />
                      </TableCell>
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
            {numSelected > 0
              ? `${numSelected} of ${filteredAccounts.length} row(s) selected.`
              : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredAccounts.length)} of ${filteredAccounts.length} accounts`}
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
        onSuccess={refetchAllPayees} // Call refetchAllPayees on success
        isAccountOnly={true}
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDelete}
        title={`Are you sure?`}
        description="This will permanently delete the selected account(s) and may affect related transactions. This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

export default AccountsPage;