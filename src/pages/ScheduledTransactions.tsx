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
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { PlusCircle, Trash2, Edit, Loader2, RotateCcw, Upload, Download, ChevronDown, ChevronUp } from "lucide-react";
import LoadingOverlay from "@/components/LoadingOverlay";
import { formatDateToDDMMYYYY } from "@/lib/utils";
import { useScheduledTransactionManagement } from "@/hooks/useScheduledTransactionManagement";
import { AddEditScheduledTransactionDialog } from "@/components/scheduled-transactions/AddEditScheduledTransactionDialog";

const ScheduledTransactionsPage = () => {
  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage, itemsPerPage,
    isConfirmOpen, setIsConfirmOpen, selectedRows, isImporting, fileInputRef,
    isFormOpen, setIsFormOpen, editingTransaction,
    scheduledTransactions, isLoading, refetch,
    deleteMutation, saveMutation,
    handleAddClick, handleEditClick, handleDeleteClick, confirmDelete,
    handleSelectAll, handleRowSelect,
    handleImportClick, handleFileChange, handleExportClick,
    handleFormSubmit,
    handleAccountClick, handleVendorClick, handleCategoryClick,
    accounts, allPayees, categories, allSubCategories,
  } = useScheduledTransactionManagement();

  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const filteredTransactions = React.useMemo(() => {
    return scheduledTransactions.filter((t) =>
      t.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.remarks || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [scheduledTransactions, searchTerm]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const numSelected = selectedRows.length;
  const rowCount = currentTransactions.length;

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const calculateUpcomingDates = React.useCallback((transaction: any, count: number = 2) => {
    const subsequentUpcoming: string[] = [];
    let currentCandidateDate = new Date(transaction.last_processed_date || transaction.date);
    currentCandidateDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const frequencyMatch = transaction.frequency.match(/^(\d+)([dwmy])$/);
    if (!frequencyMatch) return { firstUpcoming: null, subsequentUpcoming: [] };

    const [, numStr, unit] = frequencyMatch;
    const num = parseInt(numStr, 10);
    const advanceDate = (date: Date) => {
      const newDate = new Date(date);
      switch (unit) {
        case 'd': newDate.setDate(newDate.getDate() + num); break;
        case 'w': newDate.setDate(newDate.getDate() + num * 7); break;
        case 'm': newDate.setMonth(newDate.getMonth() + num); break;
        case 'y': newDate.setFullYear(newDate.getFullYear() + num); break;
      }
      return newDate;
    };

    while (currentCandidateDate <= today) {
      currentCandidateDate = advanceDate(currentCandidateDate);
    }
    const firstUpcoming = currentCandidateDate.toISOString();

    let nextDate = advanceDate(new Date(firstUpcoming));
    const endDate = transaction.recurrence_end_date ? new Date(transaction.recurrence_end_date) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    for (let i = 0; i < count; i++) {
      if (endDate && nextDate > endDate) break;
      subsequentUpcoming.push(nextDate.toISOString());
      nextDate = advanceDate(nextDate);
    }
    return { firstUpcoming, subsequentUpcoming };
  }, []);

  return (
    <div className="flex-1 space-y-4">
      <LoadingOverlay isLoading={isLoading || isImporting || deleteMutation.isPending || saveMutation.isPending} message={isImporting ? "Importing..." : "Loading..."} />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Scheduled Transactions</h2>
        <div className="flex items-center space-x-2">
          {numSelected > 0 && (
            <Button variant="destructive" onClick={() => setIsConfirmOpen(true)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete ({numSelected})
            </Button>
          )}
          <Button onClick={handleImportClick} variant="outline" disabled={isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import CSV
          </Button>
          <Button onClick={() => handleExportClick()} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
      <Card>
        <CardHeader>
          <CardTitle>Manage Scheduled Transactions</CardTitle>
          <div className="mt-4">
            <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Checkbox checked={rowCount > 0 && numSelected === rowCount} onCheckedChange={(checked) => handleSelectAll(Boolean(checked), currentTransactions)} /></TableHead>
                  <TableHead>Next Due Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={10} className="text-center">Loading...</TableCell></TableRow>
                ) : currentTransactions.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-4 text-muted-foreground">No scheduled transactions found.</TableCell></TableRow>
                ) : (
                  currentTransactions.map((transaction) => {
                    const { firstUpcoming, subsequentUpcoming } = calculateUpcomingDates(transaction);
                    const isExpanded = expandedRows.has(transaction.id);
                    return (
                      <React.Fragment key={transaction.id}>
                        <TableRow data-state={selectedRows.includes(transaction.id) && "selected"}>
                          <TableCell><Checkbox checked={selectedRows.includes(transaction.id)} onCheckedChange={(checked) => handleRowSelect(transaction.id, Boolean(checked))} /></TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Button variant="ghost" size="icon" onClick={() => toggleRowExpansion(transaction.id)} className="mr-2 h-6 w-6">
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              {firstUpcoming ? formatDateToDDMMYYYY(firstUpcoming) : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell><span onClick={() => handleAccountClick(transaction.account)} className="cursor-pointer hover:text-primary hover:underline">{transaction.account}</span></TableCell>
                          <TableCell><span onClick={() => handleVendorClick(transaction.vendor)} className="cursor-pointer hover:text-primary hover:underline">{transaction.vendor}</span></TableCell>
                          <TableCell><span onClick={() => handleCategoryClick(transaction.category)} className={transaction.category !== 'Transfer' ? "cursor-pointer hover:text-primary hover:underline" : ""}>{transaction.category}</span></TableCell>
                          <TableCell>{transaction.amount.toFixed(2)}</TableCell>
                          <TableCell>{transaction.frequency}</TableCell>
                          <TableCell>{transaction.recurrence_end_date ? formatDateToDDMMYYYY(transaction.recurrence_end_date) : '-'}</TableCell>
                          <TableCell>{transaction.remarks || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(transaction)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(transaction)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && subsequentUpcoming.map((date, index) => (
                          <TableRow key={`${transaction.id}-upcoming-${index}`} className="bg-muted/50">
                            <TableCell colSpan={2} className="pl-12">{formatDateToDDMMYYYY(date)}</TableCell>
                            <TableCell colSpan={8} className="text-muted-foreground">Upcoming transaction</TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {numSelected > 0 ? `${numSelected} of ${filteredTransactions.length} row(s) selected.` : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredTransactions.length)} of ${filteredTransactions.length} scheduled transactions`}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} /></PaginationItem>
              <PaginationItem><PaginationNext onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
      <AddEditScheduledTransactionDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        transaction={editingTransaction}
        onSubmit={handleFormSubmit}
        isSubmitting={saveMutation.isPending}
        accounts={accounts}
        allPayees={allPayees}
        categories={categories}
        allSubCategories={allSubCategories}
        isLoading={isLoading}
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDelete}
        title="Are you sure?"
        description="This will permanently delete the selected scheduled transaction(s). This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

export default ScheduledTransactionsPage;