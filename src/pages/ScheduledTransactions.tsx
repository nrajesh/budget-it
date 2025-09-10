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
import { showError, showSuccess } from "@/utils/toast";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { PlusCircle, Trash2, Edit, Loader2, RotateCcw, Upload, Download, ChevronDown, ChevronUp } from "lucide-react";
import Papa from "papaparse";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useUser } from "@/contexts/UserContext";
import { formatDateToDDMMYYYY, parseDateFromDDMMYYYY, formatDateToYYYYMMDD } from "@/lib/utils";
import { ensurePayeeExists, ensureCategoryExists } from "@/integrations/supabase/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransactions } from "@/contexts/TransactionsContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"; // Import all necessary Dialog components

type ScheduledTransaction = {
  id: string;
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  frequency: string;
  remarks?: string;
  user_id: string;
  created_at: string;
  last_processed_date?: string;
};

type ScheduledTransactionFormData = {
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  frequency_value: number;
  frequency_unit: string;
  remarks: string;
};

const ScheduledTransactionsPage = () => {
  const { user } = useUser();
  const { accounts, vendors, categories } = useTransactions();
  const [scheduledTransactions, setScheduledTransactions] = React.useState<ScheduledTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);

  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [transactionToDelete, setTransactionToDelete] = React.useState<ScheduledTransaction | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form state for adding/editing
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<ScheduledTransaction | null>(null);
  const [formData, setFormData] = React.useState<ScheduledTransactionFormData>({
    date: formatDateToYYYYMMDD(new Date()),
    account: '',
    vendor: '',
    category: '',
    amount: 0,
    frequency_value: 1,
    frequency_unit: 'm',
    remarks: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // State for expanded rows
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const allPayees = React.useMemo(() => {
    const payeeOptions = [
      ...accounts.map(p => ({ value: p.name, label: p.name, isAccount: true })),
      ...vendors.map(p => ({ value: p.name, label: p.name, isAccount: false }))
    ];
    const uniquePayees = Array.from(new Map(payeeOptions.map(item => [item.value, item])).values());
    return uniquePayees.sort((a, b) => a.label.localeCompare(b.label));
  }, [accounts, vendors]);

  // Fetch scheduled transactions
  const fetchScheduledTransactions = React.useCallback(async () => {
    if (!user) {
      setScheduledTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setScheduledTransactions(data as ScheduledTransaction[]);
    } catch (error: any) {
      showError(`Failed to fetch scheduled transactions: ${error.message}`);
      setScheduledTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchScheduledTransactions();
  }, [fetchScheduledTransactions]);

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

  const handleAddClick = () => {
    setEditingTransaction(null);
    setFormData({
      date: formatDateToYYYYMMDD(new Date()),
      account: '',
      vendor: '',
      category: '',
      amount: 0,
      frequency_value: 1,
      frequency_unit: 'm',
      remarks: '',
    });
    setIsFormOpen(true);
  };

  const handleEditClick = (transaction: ScheduledTransaction) => {
    setEditingTransaction(transaction);
    const frequencyMatch = transaction.frequency.match(/^(\d+)([dwmy])$/);
    const frequency_value = frequencyMatch ? parseInt(frequencyMatch[1], 10) : 1;
    const frequency_unit = frequencyMatch ? frequencyMatch[2] : 'm';

    setFormData({
      date: formatDateToYYYYMMDD(transaction.date),
      account: transaction.account,
      vendor: transaction.vendor,
      category: transaction.category,
      amount: transaction.amount,
      frequency_value,
      frequency_unit,
      remarks: transaction.remarks || '',
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (transaction: ScheduledTransaction) => {
    setTransactionToDelete(transaction);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!user) {
      showError("You must be logged in to delete scheduled transactions.");
      setIsConfirmOpen(false);
      return;
    }

    const idsToDelete = transactionToDelete ? [transactionToDelete.id] : selectedRows;
    const successMessage = transactionToDelete ? "Scheduled transaction deleted successfully." : `${selectedRows.length} scheduled transactions deleted successfully.`;

    try {
      const { error } = await supabase
        .from('scheduled_transactions')
        .delete()
        .in('id', idsToDelete)
        .eq('user_id', user.id);

      if (error) throw error;
      showSuccess(successMessage);
      fetchScheduledTransactions();
    } catch (error: any) {
      showError(`Failed to delete: ${error.message}`);
    } finally {
      setIsConfirmOpen(false);
      setTransactionToDelete(null);
      setSelectedRows([]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(currentTransactions.map((t) => t.id));
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
  const rowCount = currentTransactions.length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchScheduledTransactions();
    setIsRefreshing(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const requiredHeaders = ["Date", "Account", "Vendor", "Category", "Amount", "Frequency", "Remarks"];
        const actualHeaders = results.meta.fields || [];
        const hasAllHeaders = requiredHeaders.every(h => actualHeaders.includes(h));

        if (!hasAllHeaders) {
          showError(`CSV is missing required headers: ${requiredHeaders.join(", ")}`);
          setIsImporting(false);
          return;
        }

        const parsedData = results.data as any[];
        if (parsedData.length === 0) {
          showError("No data found in CSV.");
          setIsImporting(false);
          return;
        }

        try {
          // Ensure all payees and categories exist
          const uniqueAccounts = [...new Set(parsedData.map(row => row.Account))];
          await Promise.all(uniqueAccounts.map(name => ensurePayeeExists(name, true)));

          const uniqueVendors = [...new Set(parsedData.map(row => row.Vendor))];
          await Promise.all(uniqueVendors.map(name => ensurePayeeExists(name, false)));

          const uniqueCategories = [...new Set(parsedData.map(row => row.Category))];
          await Promise.all(uniqueCategories.map(name => ensureCategoryExists(name, user.id)));

          // Prepare transactions for insertion
          const transactionsToInsert = parsedData.map(row => {
            const isoDate = parseDateFromDDMMYYYY(row.Date).toISOString();
            return {
              date: isoDate,
              account: row.Account,
              vendor: row.Vendor,
              category: row.Category,
              amount: parseFloat(row.Amount) || 0,
              frequency: row.Frequency,
              remarks: row.Remarks || null,
              user_id: user.id,
              last_processed_date: isoDate,
            };
          });

          // Insert transactions
          const { error } = await supabase.from('scheduled_transactions').insert(transactionsToInsert);
          if (error) throw error;

          showSuccess(`${transactionsToInsert.length} scheduled transactions imported successfully!`);
          fetchScheduledTransactions();
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
    if (scheduledTransactions.length === 0) {
      showError("No scheduled transactions to export.");
      return;
    }

    const dataToExport = scheduledTransactions.map(t => ({
      "Date": formatDateToDDMMYYYY(t.date),
      "Account": t.account,
      "Vendor": t.vendor,
      "Category": t.category,
      "Amount": t.amount,
      "Frequency": t.frequency,
      "Remarks": t.remarks || '',
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "scheduled_transactions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. Create a clean data object from the current form state.
    const { date, account, vendor, category, amount, frequency_value, frequency_unit, remarks } = formData;

    // 2. Validate the data object.
    if (!user) {
      showError("You must be logged in.");
      setIsSubmitting(false);
      return;
    }
    if (!account || !vendor || !category) {
      showError("Please fill in all required fields: Account, Vendor, and Category.");
      setIsSubmitting(false);
      return;
    }
    if (typeof frequency_value !== 'number' || isNaN(frequency_value) || frequency_value < 1) {
      showError("Invalid frequency value. Please enter a positive number.");
      setIsSubmitting(false);
      return;
    }
    if (!['d', 'w', 'm', 'y'].includes(frequency_unit)) {
      showError("Invalid frequency unit. Please select from Days, Weeks, Months, Years.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 3. Perform async pre-flight checks.
      const isVendorAnAccount = allPayees.find(p => p.value === vendor)?.isAccount || false;
      await ensurePayeeExists(account, true);
      await ensurePayeeExists(vendor, isVendorAnAccount);
      if (category !== 'Transfer') { // Only ensure category exists if it's not the special 'Transfer' category
        await ensureCategoryExists(category, user.id);
      }

      // 4. Construct the final object for Supabase.
      const isoDate = new Date(date).toISOString();
      const frequency = `${frequency_value}${frequency_unit}`;

      const dbPayload = {
        date: isoDate,
        account,
        vendor,
        category,
        amount,
        remarks: remarks || null,
        frequency,
        last_processed_date: isoDate,
      };

      // Log the exact payload being sent for debugging
      console.log("Submitting scheduled transaction with payload:", dbPayload);

      // 5. Perform the database operation.
      if (editingTransaction) {
        const { error } = await supabase
          .from('scheduled_transactions')
          .update(dbPayload)
          .eq('id', editingTransaction.id);
        if (error) throw error;
        showSuccess("Scheduled transaction updated successfully!");
      } else {
        const { error } = await supabase
          .from('scheduled_transactions')
          .insert({ ...dbPayload, user_id: user.id });
        if (error) throw error;
        showSuccess("Scheduled transaction added successfully!");
      }
      
      // 6. Cleanup and refresh.
      fetchScheduledTransactions();
      setIsFormOpen(false);

    } catch (error: any) {
      console.error("Error saving scheduled transaction:", error); // Log the full error object
      showError(`Failed to save scheduled transaction: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'amount') {
        return { ...prev, [name]: parseFloat(value) || 0 };
      } else if (name === 'frequency_value') {
        // Ensure frequency_value is always a positive integer, default to 1 if invalid
        const parsedValue = parseInt(value, 10);
        return { ...prev, [name]: isNaN(parsedValue) || parsedValue < 1 ? 1 : parsedValue };
      } else {
        return { ...prev, [name]: value };
      }
    });
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const calculateUpcomingDates = (transaction: ScheduledTransaction, count: number = 2): { firstUpcoming: string | null; subsequentUpcoming: string[] } => {
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

    // Find the first occurrence that is strictly AFTER today
    while (currentCandidateDate <= today) {
      currentCandidateDate = advanceDate(currentCandidateDate);
      currentCandidateDate.setHours(0, 0, 0, 0); // Normalize after advancing
    }

    const firstUpcoming = currentCandidateDate.toISOString();

    // Generate subsequent occurrences
    let nextDate = advanceDate(new Date(firstUpcoming)); // Start from the date *after* the first upcoming
    nextDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < count; i++) {
      subsequentUpcoming.push(nextDate.toISOString());
      nextDate = advanceDate(nextDate);
      nextDate.setHours(0, 0, 0, 0); // Normalize after advancing
    }

    return { firstUpcoming, subsequentUpcoming };
  };

  return (
    <div className="flex-1 space-y-4">
      <LoadingOverlay isLoading={isImporting || isRefreshing} message={isImporting ? "Importing scheduled transactions..." : "Refreshing scheduled transactions..."} />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Scheduled Transactions</h2>
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
            <PlusCircle className="mr-2 h-4 w-4" /> Add Scheduled Transaction
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
            <span className="sr-only">Refresh Scheduled Transactions</span>
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
          <CardTitle>Manage Scheduled Transactions</CardTitle>
          <div className="mt-4">
            <Input
              placeholder="Search by account, vendor, category, or remarks..."
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
                  <TableHead>Next Due Date</TableHead> {/* Updated column header */}
                  <TableHead>Account</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : currentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                      No scheduled transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTransactions.map((transaction) => {
                    const { firstUpcoming, subsequentUpcoming } = calculateUpcomingDates(transaction);
                    const isExpanded = expandedRows.has(transaction.id);

                    return (
                      <React.Fragment key={transaction.id}>
                        <TableRow data-state={selectedRows.includes(transaction.id) && "selected"}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRows.includes(transaction.id)}
                              onCheckedChange={(checked) => handleRowSelect(transaction.id, Boolean(checked))}
                              aria-label="Select row"
                            />
                          </TableCell><TableCell>
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleRowExpansion(transaction.id)}
                                className="mr-2 h-6 w-6"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              {firstUpcoming ? formatDateToDDMMYYYY(firstUpcoming) : 'N/A'}
                            </div>
                          </TableCell><TableCell>{transaction.account}</TableCell><TableCell>{transaction.vendor}</TableCell><TableCell>{transaction.category}</TableCell><TableCell>{transaction.amount.toFixed(2)}</TableCell><TableCell>{transaction.frequency}</TableCell><TableCell>{transaction.remarks || '-'}</TableCell><TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(transaction)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(transaction)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Expanded rows for subsequent upcoming dates */}
                        {isExpanded && subsequentUpcoming.map((date, index) => (
                          <TableRow key={`${transaction.id}-upcoming-${index}`} className="bg-muted/50">
                            <TableCell colSpan={2} className="pl-12">
                              {formatDateToDDMMYYYY(date)}
                            </TableCell><TableCell colSpan={7} className="text-muted-foreground">
                              Upcoming transaction
                            </TableCell>
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
            {numSelected > 0
              ? `${numSelected} of ${filteredTransactions.length} row(s) selected.`
              : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredTransactions.length)} of ${filteredTransactions.length} scheduled transactions`}
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

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Edit" : "Add"} Scheduled Transaction</DialogTitle>
            <DialogDescription>
              Define a recurring transaction. Occurrences up to today will be automatically added to your transactions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-1">Date</label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="account" className="block text-sm font-medium mb-1">Account</label>
                <Select
                  name="account"
                  value={formData.account}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, account: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.name}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="vendor" className="block text-sm font-medium mb-1">Vendor / Account</label>
                <Select
                  name="vendor"
                  value={formData.vendor}
                  onValueChange={(value) => {
                    const selectedPayee = allPayees.find(p => p.value === value);
                    const isTransfer = selectedPayee?.isAccount;
                    setFormData(prev => ({
                      ...prev,
                      vendor: value,
                      category: isTransfer ? 'Transfer' : prev.category === 'Transfer' ? '' : prev.category
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor or account" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPayees.map(payee => (
                      <SelectItem key={payee.value} value={payee.value}>
                        {payee.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
                <Select
                  name="category"
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  disabled={allPayees.find(p => p.value === formData.vendor)?.isAccount}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.name !== 'Transfer').map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount</label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <label htmlFor="frequency_value" className="block text-sm font-medium mb-1">Frequency</label>
                  <Input
                    id="frequency_value"
                    name="frequency_value"
                    type="number"
                    min="1"
                    value={formData.frequency_value}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <Select
                    name="frequency_unit"
                    value={formData.frequency_unit}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, frequency_unit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="d">Days</SelectItem>
                      <SelectItem value="w">Weeks</SelectItem>
                      <SelectItem value="m">Months</SelectItem>
                      <SelectItem value="y">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium mb-1">Remarks</label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleFormChange}
                className="w-full p-2 border rounded-md min-h-[100px]"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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