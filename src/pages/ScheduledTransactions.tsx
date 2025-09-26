import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScheduledTransaction as ScheduledTransactionType, createScheduledTransactionsService } from '@/services/scheduledTransactionsService';
import { useCurrency } from "@/contexts/CurrencyContext";


const ScheduledTransactionsPage = () => {
  const { user, isLoadingUser } = useUser();
  const { accounts, vendors, categories, isLoadingAccounts, isLoadingVendors, isLoadingCategories, refetchTransactions: refetchMainTransactions } = useTransactions();
  const { convertBetweenCurrencies } = useCurrency();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);

  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [transactionToDelete, setTransactionToDelete] = React.useState<ScheduledTransactionType | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);

  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<ScheduledTransactionType | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  // Refactor allPayees from useRef to useMemo
  const allPayees = React.useMemo(() => {
    return [
      ...accounts.map(p => ({ value: p.name, label: p.name, isAccount: true })),
      ...vendors.map(p => ({ value: p.name, label: p.name, isAccount: false }))
    ].sort((a, b) => a.label.localeCompare(b.label));
  }, [accounts, vendors]);

  // Define Zod schema for form validation inside the component
  const formSchema = React.useMemo(() => z.object({
    date: z.string().min(1, "Date is required"),
    account: z.string().min(1, "Account is required"),
    vendor: z.string().min(1, "Vendor is required"),
    category: z.string().min(1, "Category is required"),
    amount: z.coerce.number().refine(val => val !== 0, { message: "Amount cannot be zero" }),
    frequency_value: z.coerce.number().min(1, "Frequency value must be at least 1"),
    frequency_unit: z.string().min(1, "Frequency unit is required"),
    remarks: z.string().optional(),
    recurrence_end_date: z.string().optional(), // Added recurrence_end_date
  }).refine(data => {
    const isVendorAnAccount = (payees: { value: string; label: string; isAccount: boolean }[]) => {
      return payees.find(p => p.value === data.vendor)?.isAccount;
    };
    // Use the memoized allPayees directly here
    if (allPayees && isVendorAnAccount(allPayees) && data.category !== 'Transfer') {
      return false; // If vendor is an account, category must be 'Transfer'
    }
    if (allPayees && !isVendorAnAccount(allPayees) && data.category === 'Transfer') {
      return false; // If vendor is not an account, category cannot be 'Transfer'
    }
    return true;
  }, {
    message: "Category must be 'Transfer' if vendor is an account, otherwise it cannot be 'Transfer'.",
    path: ["category"],
  }), [allPayees]); // Dependency on allPayees

  type ScheduledTransactionFormData = z.infer<typeof formSchema>; // Moved here

  // Get today's date in YYYY-MM-DD format for the min attribute of the date input
  const todayDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayDateString = React.useMemo(() => formatDateToYYYYMMDD(todayDate), [todayDate]);

  const tomorrowDateString = React.useMemo(() => {
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(todayDate.getDate() + 1);
    return formatDateToYYYYMMDD(tomorrow);
  }, [todayDate]);

  const dayAfterTomorrowDateString = React.useMemo(() => {
    const dayAfterTomorrow = new Date(todayDate);
    dayAfterTomorrow.setDate(todayDate.getDate() + 2);
    return formatDateToYYYYMMDD(dayAfterTomorrow);
  }, [todayDate]);

  // Fetch scheduled transactions using react-query
  const { fetchScheduledTransactions, processScheduledTransactions } = createScheduledTransactionsService({
    refetchTransactions: refetchMainTransactions,
    userId: user?.id,
    convertBetweenCurrencies,
  });

  const { data: scheduledTransactions = [], isLoading: isLoadingScheduledTransactions, refetch: refetchScheduledTransactions } = useQuery<ScheduledTransactionType[], Error>({
    queryKey: ['scheduledTransactions', user?.id],
    queryFn: fetchScheduledTransactions,
    enabled: !!user?.id && !isLoadingUser,
  });

  const form = useForm<ScheduledTransactionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: tomorrowDateString, // Default to tomorrow for new transactions
      account: '',
      vendor: '',
      category: '',
      amount: 0,
      frequency_value: 1,
      frequency_unit: 'm',
      remarks: '',
      recurrence_end_date: '', // Added recurrence_end_date
    },
    mode: "onChange", // Validate on change
  });

  React.useEffect(() => {
    if (isFormOpen) {
      if (editingTransaction) {
        const transactionDate = new Date(editingTransaction.date);
        transactionDate.setHours(0, 0, 0, 0);

        const frequencyMatch = editingTransaction.frequency.match(/^(\d+)([dwmy])$/);
        const frequency_value = frequencyMatch ? parseInt(frequencyMatch[1], 10) : 1;
        const frequency_unit = frequencyMatch ? frequencyMatch[2] : 'm';

        form.reset({
          date: formatDateToYYYYMMDD(editingTransaction.date),
          account: editingTransaction.account,
          vendor: editingTransaction.vendor,
          category: editingTransaction.category,
          amount: editingTransaction.amount,
          frequency_value,
          frequency_unit,
          remarks: editingTransaction.remarks || '',
          recurrence_end_date: editingTransaction.recurrence_end_date ? formatDateToYYYYMMDD(editingTransaction.recurrence_end_date) : '',
        });
      } else {
        form.reset({
          date: tomorrowDateString, // Default to tomorrow for new transactions
          account: '',
          vendor: '',
          category: '',
          amount: 0,
          frequency_value: 1,
          frequency_unit: 'm',
          remarks: '',
          recurrence_end_date: '',
        });
      }
    }
  }, [isFormOpen, editingTransaction, form, todayDateString, todayDate, tomorrowDateString]);

  // Watch vendor field to dynamically set category for transfers
  const watchedVendor = form.watch("vendor");
  const isVendorAnAccount = React.useMemo(() => {
    return allPayees.find(p => p.value === watchedVendor)?.isAccount || false;
  }, [watchedVendor, allPayees]);

  React.useEffect(() => {
    if (isVendorAnAccount) {
      form.setValue("category", "Transfer", { shouldValidate: true });
    } else if (form.getValues("category") === "Transfer") {
      form.setValue("category", "", { shouldValidate: true });
    }
  }, [isVendorAnAccount, form]);

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
    setIsFormOpen(true);
  };

  const handleEditClick = (transaction: ScheduledTransactionType) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (transaction: ScheduledTransactionType) => {
    setTransactionToDelete(transaction);
    setIsConfirmOpen(true);
  };

  // Mutation for deleting scheduled transactions
  const deleteScheduledTransactionMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) throw new Error("User not logged in.");
      const { error } = await supabase
        .from('scheduled_transactions')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      showSuccess(transactionToDelete ? "Scheduled transaction deleted successfully." : `${selectedRows.length} scheduled transactions deleted successfully.`);
      await refetchScheduledTransactions(); // Refetch scheduled transactions
      setIsConfirmOpen(false);
      setTransactionToDelete(null);
      setSelectedRows([]);
    },
    onError: (error: any) => {
      showError(`Failed to delete: ${error.message}`);
    },
  });

  const confirmDelete = () => {
    const idsToDelete = transactionToDelete ? [transactionToDelete.id] : selectedRows;
    deleteScheduledTransactionMutation.mutate(idsToDelete);
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Mutation for batch upserting scheduled transactions
  const batchUpsertScheduledTransactionsMutation = useMutation({
    mutationFn: async (transactionsToInsert: any[]) => {
      const { error } = await supabase.from('scheduled_transactions').insert(transactionsToInsert);
      if (error) throw error;
    },
    onSuccess: async (data, variables) => {
      showSuccess(`${variables.length} scheduled transactions imported successfully!`);
      await refetchScheduledTransactions(); // Refetch scheduled transactions
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      showError(`Import failed: ${error.message}`);
      setIsImporting(false);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const requiredHeaders = ["Date", "Account", "Vendor", "Category", "Amount", "Frequency", "Remarks", "End Date"]; // Added End Date
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
          await Promise.all(uniqueVendors.map(name => {
            const row = parsedData.find(r => r.Vendor === name);
            const isTransfer = row?.Category === 'Transfer'; // Check if it's a transfer from CSV
            return ensurePayeeExists(name, isTransfer);
          }));

          const uniqueCategories = [...new Set(parsedData.map(row => row.Category))];
          await Promise.all(uniqueCategories.map(name => ensureCategoryExists(name, user.id)));

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          let pastDatesFoundInImport = false;

          const transactionsToInsert = parsedData.map(row => {
            const parsedDate = parseDateFromDDMMYYYY(row.Date);
            parsedDate.setHours(0, 0, 0, 0);

            const isoDate = parsedDate.toISOString();
            let lastProcessedDateForDb = isoDate;

            if (parsedDate < today) {
                pastDatesFoundInImport = true;
                lastProcessedDateForDb = today.toISOString();
            }

            return {
              date: isoDate,
              account: row.Account,
              vendor: row.Vendor,
              category: row.Category,
              amount: parseFloat(row.Amount) || 0,
              frequency: row.Frequency,
              remarks: row.Remarks || null,
              user_id: user.id,
              last_processed_date: lastProcessedDateForDb,
              recurrence_end_date: row["End Date"] ? parseDateFromDDMMYYYY(row["End Date"]).toISOString() : null, // Added End Date
            };
          });

          batchUpsertScheduledTransactionsMutation.mutate(transactionsToInsert);

          if (pastDatesFoundInImport) {
            showError("Some imported scheduled transactions had past dates. Their processing will start from today.");
          }
        } catch (error: any) {
          showError(`Import failed: ${error.message}`);
          setIsImporting(false);
        } finally {
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
      "End Date": t.recurrence_end_date ? formatDateToDDMMYYYY(t.recurrence_end_date) : '', // Added End Date
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

  // Mutation for adding/updating a single scheduled transaction
  const saveScheduledTransactionMutation = useMutation({
    mutationFn: async (data: ScheduledTransactionFormData) => {
      if (!user) throw new Error("User not logged in.");

      const isVendorAnAccount = allPayees.find(p => p.value === data.vendor)?.isAccount || false; // Use allPayees here
      await ensurePayeeExists(data.account, true);
      await ensurePayeeExists(data.vendor, isVendorAnAccount);
      if (data.category !== 'Transfer') {
        await ensureCategoryExists(data.category, user.id);
      }

      const isoDate = new Date(data.date).toISOString();
      const frequency = `${data.frequency_value}${data.frequency_unit}`;

      const dbPayload = {
        date: isoDate,
        account: data.account,
        vendor: data.vendor,
        category: data.category,
        amount: data.amount,
        remarks: data.remarks || null,
        frequency,
        last_processed_date: isoDate, // Initial last_processed_date is the scheduled date
        recurrence_end_date: data.recurrence_end_date ? new Date(data.recurrence_end_date).toISOString() : null, // Added recurrence_end_date
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from('scheduled_transactions')
          .update(dbPayload)
          .eq('id', editingTransaction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('scheduled_transactions')
          .insert({ ...dbPayload, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      showSuccess(editingTransaction ? "Scheduled transaction updated successfully!" : "Scheduled transaction added successfully!");
      await refetchScheduledTransactions(); // Refetch scheduled transactions
      setIsFormOpen(false);
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      showError(`Failed to save scheduled transaction: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleFormSubmit = async (values: ScheduledTransactionFormData) => {
    setIsSubmitting(true);
    saveScheduledTransactionMutation.mutate(values);
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

  const calculateUpcomingDates = React.useCallback((transaction: ScheduledTransactionType, count: number = 2): { firstUpcoming: string | null; subsequentUpcoming: string[] } => {
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
      currentCandidateDate.setHours(0, 0, 0, 0);
    }

    const firstUpcoming = currentCandidateDate.toISOString();

    // Generate subsequent occurrences, respecting recurrence_end_date
    let nextDate = advanceDate(new Date(firstUpcoming));
    nextDate.setHours(0, 0, 0, 0);

    const endDate = transaction.recurrence_end_date ? new Date(transaction.recurrence_end_date) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999); // Normalize to end of day

    for (let i = 0; i < count; i++) {
      if (endDate && nextDate > endDate) {
        break; // Stop if we've passed the end date
      }
      subsequentUpcoming.push(nextDate.toISOString());
      nextDate = advanceDate(nextDate);
      nextDate.setHours(0, 0, 0, 0);
    }

    return { firstUpcoming, subsequentUpcoming };
  }, []);

  const isPageLoading = isLoadingScheduledTransactions || isLoadingAccounts || isLoadingVendors || isLoadingCategories || isLoadingUser;

  return (
    <div className="flex-1 space-y-4">
      <LoadingOverlay isLoading={isPageLoading || isImporting || deleteScheduledTransactionMutation.isPending || batchUpsertScheduledTransactionsMutation.isPending || saveScheduledTransactionMutation.isPending} message={isImporting ? "Importing scheduled transactions..." : "Loading scheduled transactions..."} />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Scheduled Transactions</h2>
        <div className="flex items-center space-x-2">
          {numSelected > 0 && (
            <Button variant="destructive" onClick={() => setIsConfirmOpen(true)} disabled={deleteScheduledTransactionMutation.isPending}>
              {deleteScheduledTransactionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete ({numSelected})
            </Button>
          )}
          <Button onClick={handleImportClick} variant="outline" disabled={isImporting || batchUpsertScheduledTransactionsMutation.isPending}>
            {isImporting || batchUpsertScheduledTransactionsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import CSV
          </Button>
          <Button onClick={handleExportClick} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleAddClick} disabled={saveScheduledTransactionMutation.isPending}>
            {saveScheduledTransactionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <PlusCircle className="mr-2 h-4 w-4" /> Add Scheduled Transaction
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={async () => await refetchScheduledTransactions()}
            disabled={isLoadingScheduledTransactions}
          >
            {isLoadingScheduledTransactions ? (
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
                  <TableHead>Next Due Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>End Date</TableHead> {/* Added End Date */}
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingScheduledTransactions ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">Loading...</TableCell> {/* Adjusted colspan */}
                  </TableRow>
                ) : currentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-4 text-muted-foreground"> {/* Adjusted colspan */}
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
                          </TableCell><TableCell>{transaction.account}</TableCell><TableCell>{transaction.vendor}</TableCell><TableCell>{transaction.category}</TableCell><TableCell>{transaction.amount.toFixed(2)}</TableCell><TableCell>{transaction.frequency}</TableCell><TableCell>{transaction.recurrence_end_date ? formatDateToDDMMYYYY(transaction.recurrence_end_date) : '-'}</TableCell> {/* Display End Date */}
                          <TableCell>{transaction.remarks || '-'}</TableCell><TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(transaction)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(transaction)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        {isExpanded && subsequentUpcoming.map((date, index) => (
                          <TableRow key={`${transaction.id}-upcoming-${index}`} className="bg-muted/50">
                            <TableCell colSpan={2} className="pl-12">
                              {formatDateToDDMMYYYY(date)}
                            </TableCell><TableCell colSpan={8} className="text-muted-foreground"> {/* Adjusted colspan */}
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel> {/* Changed label to Start Date */}
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          min={tomorrowDateString} // Only allow tomorrow or future dates
                        />
                      </FormControl>
                      <FormDescription>
                        Only future dates (from tomorrow onwards) can be selected.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recurrence_end_date" // Added End Date field
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          min={
                            form.watch("date")
                              ? formatDateToYYYYMMDD(
                                  new Date(
                                    Math.max(
                                      new Date(form.watch("date")).getTime(),
                                      new Date(dayAfterTomorrowDateString).getTime()
                                    )
                                  )
                                )
                              : dayAfterTomorrowDateString // If start date is not yet selected, default min to day after tomorrow
                          }
                          {...field}
                          value={field.value || ''} // Ensure controlled component
                        />
                      </FormControl>
                      <FormDescription>
                        The end date must be at least the start date, and at least day after tomorrow.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="account"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingAccounts}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map(account => (
                            <SelectItem key={account.id} value={account.name}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor / Account</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingVendors || isLoadingAccounts}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor or account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allPayees.map(payee => (
                            <SelectItem key={payee.value} value={payee.value}>
                              {payee.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isVendorAnAccount || isLoadingCategories} // Disable if vendor is an account
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name="frequency_value"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel>Frequency</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value, 10))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="frequency_unit"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="d">Days</SelectItem>
                            <SelectItem value="w">Weeks</SelectItem>
                            <SelectItem value="m">Months</SelectItem>
                            <SelectItem value="y">Years</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional notes about the scheduled transaction"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
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