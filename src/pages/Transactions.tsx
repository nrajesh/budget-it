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
import { Transaction, accounts as allDefinedAccounts, categories as allDefinedCategories } from "@/data/finance-data";
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
import { RotateCcw } from "lucide-react"; // Import the reset icon

const ITEMS_PER_PAGE = 10;

const TransactionsPage = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);
  const { transactions } = useTransactions();
  const { formatCurrency } = useCurrency();

  // Filter states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  const availableAccountOptions = React.useMemo(() => {
    return allDefinedAccounts.map(account => ({
      value: slugify(account),
      label: account,
    }));
  }, []);

  const availableCategoryOptions = React.useMemo(() => {
    return allDefinedCategories.map(category => ({
      value: slugify(category),
      label: category,
    }));
  }, []);

  // Initialize selected filters to "all" by default
  React.useEffect(() => {
    setSelectedAccounts(availableAccountOptions.map(acc => acc.value));
    setSelectedCategories(availableCategoryOptions.map(cat => cat.value));
  }, [availableAccountOptions, availableCategoryOptions]);

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

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
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

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredTransactions]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 items-end"> {/* Added items-end for alignment */}
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
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto"> {/* Added overflow-x-auto here */}
              <Table>
                <TableHeader>
                  <TableRow>
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
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No transactions found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentTransactions.map((transaction) => (
                      <TableRow key={transaction.id} onClick={() => handleRowClick(transaction)} className="cursor-pointer">
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.account}</TableCell>
                        <TableCell>{transaction.vendor}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell className={`text-right ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{transaction.remarks}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
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
        {selectedTransaction && (
          <EditTransactionDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            transaction={selectedTransaction}
          />
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;