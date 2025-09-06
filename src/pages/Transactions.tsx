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
import { Transaction, categories as allDefinedCategories } from "@/data/finance-data";
import EditTransactionDialog from "@/components/EditTransactionDialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Input } from "@/components/ui/input";
import { MultiSelectDropdown } from "@/components/MultiSelectDropdown";
import { DateRangePicker } from "@/components/DateRangePicker";
import { slugify } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { RotateCcw, Trash2, Upload, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client"; // Import supabase
import { Loader2 } from "lucide-react"; // Import Loader2 icon
import Papa from "papaparse";
import { ensurePayeeExists, getAccountCurrency } from "@/integrations/supabase/utils";
import { showSuccess, showError } from "@/utils/toast";

const TransactionsPage = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);
  const [selectedTransactionIds, setSelectedTransactionIds] = React.useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false); // New state for refresh loading
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { transactions, deleteMultipleTransactions, accountCurrencyMap, fetchTransactions, fetchAccounts, refetchAllPayees } = useTransactions(); // Get accountCurrencyMap and fetchTransactions
  const { formatCurrency } = useCurrency();

  // Filter states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  // State for dynamically fetched account options
  const [availableAccountOptions, setAvailableAccountOptions] = React.useState<{ value: string; label: string }[]>([]);

  // Fetch available accounts dynamically
  const fetchAvailableAccounts = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('vendors')
      .select('name')
      .eq('is_account', true);

    if (error) {
      console.error("Error fetching account names:", error.message);
      setAvailableAccountOptions([]);
    } else {
      const options = data.map(item => ({
        value: slugify(item.name),
        label: item.name,
      }));
      setAvailableAccountOptions(options);
    }
  }, []);

  React.useEffect(() => {
    fetchAvailableAccounts();
  }, [fetchAvailableAccounts]);

  const availableCategoryOptions = React.useMemo(() => {
    return allDefinedCategories.map(category => ({
      value: slugify(category),
      label: category,
    }));
  }, []);

  // Initialize selected filters to "all" by default
  React.useEffect(() => {
    if (availableAccountOptions.length > 0) {
      setSelectedAccounts(availableAccountOptions.map(acc => acc.value));
    }
  }, [availableAccountOptions]);

  React.useEffect(() => {
    if (availableCategoryOptions.length > 0) {
      setSelectedCategories(availableCategoryOptions.map(cat => cat.value));
    }
  }, [availableCategoryOptions]);

  const filteredTransactions = React.useMemo(() => {
    let filtered = transactions;

    // Filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.vendor.toLowerCase().includes(lowerCaseSearchTerm) ||
          (t.remarks && t.remarks.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    // Filter by selected accounts
    if (selectedAccounts.length > 0 && selectedAccounts.length !== availableAccountOptions.length) {
      filtered = filtered.filter((t) => selectedAccounts.includes(slugify(t.account)));
    }

    // Filter by selected categories
    if (selectedCategories.length > 0 && selectedCategories.length !== availableCategoryOptions.length) {
      filtered = filtered.filter((t) => selectedCategories.includes(slugify(t.category)));
    }

    // Filter by date range
    if (dateRange?.from) {
      const fromDate = dateRange.from;
      const toDate = dateRange.to || new Date(); // If 'to' is not set, assume today
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= fromDate && transactionDate <= toDate;
      });
    }

    return filtered;
  }, [transactions, searchTerm, selectedAccounts, selectedCategories, dateRange, availableAccountOptions.length, availableCategoryOptions.length]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedAccounts(availableAccountOptions.map(acc => acc.value));
    setSelectedCategories(availableCategoryOptions.map(cat => cat.value));
    setDateRange(undefined);
  };

  // Multi-select handlers
  const handleSelectOne = (id: string) => {
    setSelectedTransactionIds((prev) =>
      prev.includes(id) ? prev.filter((_id) => _id !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactionIds(currentTransactions.map((t) => t.id));
    } else {
      setSelectedTransactionIds([]);
    }
  };

  const isAllSelectedOnPage =
    currentTransactions.length > 0 &&
    currentTransactions.every((t) => selectedTransactionIds.includes(t.id));

  const handleBulkDelete = () => {
    const transactionsToDelete = selectedTransactionIds.map(id => {
      const transaction = transactions.find(t => t.id === id);
      return { id, transfer_id: transaction?.transfer_id };
    });
    deleteMultipleTransactions(transactionsToDelete);
    setSelectedTransactionIds([]);
    setIsBulkDeleteConfirmOpen(false);
  };

  // Reset pagination and selection when filters or itemsPerPage change
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedTransactionIds([]);
  }, [filteredTransactions, itemsPerPage]);

  const numSelected = selectedTransactionIds.length; // Corrected from selectedRows
  const rowCount = currentTransactions.length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions();
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
        const requiredHeaders = ["Date", "Account", "Vendor", "Category", "Amount", "Remarks"];
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
          // Step 1: Ensure all payees exist
          const uniqueAccounts = [...new Set(parsedData.map(row => row.Account).filter(Boolean))];
          const uniqueVendors = [...new Set(parsedData.map(row => row.Vendor).filter(Boolean))];

          await Promise.all(uniqueAccounts.map(name => ensurePayeeExists(name, true)));
          await Promise.all(uniqueVendors.map(name => {
            const row = parsedData.find(r => r.Vendor === name);
            const isTransfer = row?.Category === 'Transfer';
            return ensurePayeeExists(name, isTransfer);
          }));

          // Step 2: Fetch currencies for all accounts involved
          const currencyPromises = uniqueAccounts.map(name => getAccountCurrency(name));
          const currencies = await Promise.all(currencyPromises);
          const currencyMap = new Map(uniqueAccounts.map((name, i) => [name, currencies[i]]));

          const transactionsToInsert = parsedData.map(row => {
            const accountCurrency = currencyMap.get(row.Account);
            if (!accountCurrency) {
              console.warn(`Could not find currency for account: ${row.Account}. Skipping row.`);
              return null;
            }
            return {
              date: new Date(row.Date).toISOString(),
              account: row.Account,
              vendor: row.Vendor,
              category: row.Category,
              amount: parseFloat(row.Amount) || 0,
              remarks: row.Remarks,
              currency: accountCurrency,
            };
          }).filter((t): t is NonNullable<typeof t> => t !== null);

          if (transactionsToInsert.length === 0) {
            showError("No valid transactions could be prepared from the CSV. Check account names and amounts.");
            setIsImporting(false);
            return;
          }

          // Step 3: Insert transactions
          const { error } = await supabase.from('transactions').insert(transactionsToInsert);
          if (error) throw error;

          showSuccess(`${transactionsToInsert.length} transactions imported successfully!`);
          await refetchAllPayees(); // This also calls fetchTransactions
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
    if (transactions.length === 0) {
      showError("No transactions to export.");
      return;
    }

    const dataToExport = transactions.map(t => ({
      "Date": new Date(t.date).toLocaleDateString(),
      "Account": t.account,
      "Vendor": t.vendor,
      "Category": t.category,
      "Amount": t.amount,
      "Remarks": t.remarks,
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "transactions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              All Transactions
              <div className="flex items-center space-x-2">
                <Button onClick={handleImportClick} variant="outline" disabled={isImporting}>
                  {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Import CSV
                </Button>
                <Button onClick={handleExportClick} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  <span className="sr-only">Refresh Transactions</span>
                </Button>
              </div>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 items-end">
              <Input
                placeholder="Search vendor or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm w-full"
              />
              <MultiSelectDropdown
                options={availableAccountOptions}
                selectedValues={selectedAccounts}
                onSelectChange={setSelectedAccounts}
                placeholder="Filter by Account"
              />
              <MultiSelectDropdown
                options={availableCategoryOptions}
                selectedValues={selectedCategories}
                onSelectChange={setSelectedCategories}
                placeholder="Filter by Category"
              />
              <DateRangePicker dateRange={dateRange} onDateChange={setDateRange} />
              <Button variant="outline" size="icon" onClick={handleResetFilters} className="shrink-0">
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Reset Filters</span>
              </Button>
            </div>
            {selectedTransactionIds.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="destructive"
                  onClick={() => setIsBulkDeleteConfirmOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedTransactionIds.length})
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".csv"
            />
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelectedOnPage}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all transactions on current page"
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No transactions found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentTransactions.map((transaction) => {
                      const currentAccountCurrency = accountCurrencyMap.get(transaction.account) || transaction.currency; // Use current account currency
                      return (
                        <TableRow key={transaction.id} className="group">
                          <TableCell>
                            <Checkbox
                              checked={selectedTransactionIds.includes(transaction.id)}
                              onCheckedChange={() => handleSelectOne(transaction.id)}
                              aria-label={`Select transaction ${transaction.id}`}
                            />
                          </TableCell>
                          <TableCell onDoubleClick={() => handleRowClick(transaction)} className="cursor-pointer group-hover:bg-accent/50">
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell onDoubleClick={() => handleRowClick(transaction)} className="cursor-pointer group-hover:bg-accent/50">
                            {transaction.account}
                          </TableCell>
                          <TableCell onDoubleClick={() => handleRowClick(transaction)} className="cursor-pointer group-hover:bg-accent/50">
                            {transaction.vendor}
                          </TableCell>
                          <TableCell onDoubleClick={() => handleRowClick(transaction)} className="cursor-pointer group-hover:bg-accent/50">
                            {transaction.category}
                          </TableCell>
                          <TableCell onDoubleClick={() => handleRowClick(transaction)} className={`text-right ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'} cursor-pointer group-hover:bg-accent/50`}>
                            {formatCurrency(transaction.amount, currentAccountCurrency)}
                          </TableCell>
                          <TableCell onDoubleClick={() => handleRowClick(transaction)} className="cursor-pointer group-hover:bg-accent/50">
                            {transaction.remarks}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </span>
              <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {/* Removed individual page numbers */}
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
        {selectedTransaction && (
          <EditTransactionDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            transaction={selectedTransaction}
          />
        )}
        <ConfirmationDialog
          isOpen={isBulkDeleteConfirmOpen}
          onOpenChange={setIsBulkDeleteConfirmOpen}
          onConfirm={handleBulkDelete}
          title={`Are you sure you want to delete ${selectedTransactionIds.length} transactions?`}
          description="This action cannot be undone. All selected transactions and their associated transfer entries (if any) will be permanently deleted."
          confirmText="Delete Selected"
        />
      </div>
    </div>
  );
};

export default TransactionsPage;