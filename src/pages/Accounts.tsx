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
import { useCurrency } from "@/contexts/CurrencyContext";
import AddEditPayeeDialog, { Payee } from "@/components/AddEditPayeeDialog";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { PlusCircle, Trash2, Edit, Upload, Download, Loader2, RotateCcw } from "lucide-react";
import { useTransactions } from "@/contexts/TransactionsContext";
import LoadingOverlay from "@/components/LoadingOverlay";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";

const AccountsPage = () => {
  const { accounts, isLoadingAccounts, refetchAccounts, invalidateAllData } = useTransactions();
  const { formatCurrency } = useCurrency();
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
  } = usePayeeManagement(true);

  const filteredAccounts = React.useMemo(() => {
    return accounts.filter((acc) =>
      acc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAccounts = filteredAccounts.slice(startIndex, endIndex);

  const numSelected = selectedRows.length;
  const rowCount = currentAccounts.length;

  return (
    <div className="flex-1 space-y-4">
      <LoadingOverlay isLoading={isLoadingAccounts || isImporting || deletePayeesMutation.isPending} message={isImporting ? "Importing accounts..." : "Loading accounts..."} />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
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
          <Button onClick={() => handleExportClick(accounts)} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Account
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={async () => await refetchAccounts()}
            disabled={isLoadingAccounts}
          >
            {isLoadingAccounts ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            <span className="sr-only">Refresh Accounts</span>
          </Button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
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
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked), currentAccounts)}
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
                {isLoadingAccounts ? (
                  <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
                ) : currentAccounts.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-4 text-muted-foreground">No accounts found.</TableCell></TableRow>
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
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(account)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(account)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
              <PaginationItem><PaginationPrevious onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} /></PaginationItem>
              <PaginationItem><PaginationNext onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
      <AddEditPayeeDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        payee={selectedPayee}
        onSuccess={async () => await invalidateAllData()}
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