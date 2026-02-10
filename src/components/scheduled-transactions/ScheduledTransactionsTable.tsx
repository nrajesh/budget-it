import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatDateToDDMMYYYY } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  PlayCircle,
  X,
  Link,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTransactions } from "@/contexts/TransactionsContext";
import { ScheduledTransaction } from "@/types/dataProvider";

interface ScheduledTransactionsTableProps {
  transactions: ScheduledTransaction[];
  onEdit?: (transaction: ScheduledTransaction) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onProcessToday?: (transaction: ScheduledTransaction) => void;
  onUnlink?: (transferId: string) => void;
}

export function ScheduledTransactionsTable({
  transactions = [],
  onEdit,
  onDelete,
  onBulkDelete,
  onProcessToday,
  onUnlink,
}: ScheduledTransactionsTableProps) {
  const { accountCurrencyMap } = useTransactions();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = React.useState(1);
  const transactionsPerPage = 10;

  const handleAccountClick = (accountName: string) => {
    navigate("/transactions", { state: { filterAccount: accountName } });
  };

  const handleVendorClick = (vendorName: string) => {
    const isAccount = accountCurrencyMap.has(vendorName);
    const filterKey = isAccount ? "filterAccount" : "filterVendor";
    navigate("/transactions", { state: { [filterKey]: vendorName } });
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate("/transactions", { state: { filterCategory: categoryName } });
  };

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction,
  );

  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Selection Handlers
  const toggleSelectAll = () => {
    // "Select All" means select ALL filtered transactions (as per user request)
    if (selectedIds.size === transactions.length && transactions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);

    const txn = transactions.find((t) => t.id === id);
    const idsToToggle = [id];

    // If part of a transfer, find pair
    if (txn?.transfer_id) {
      const pair = transactions.find(
        (t) => t.transfer_id === txn.transfer_id && t.id !== id,
      );
      if (pair) idsToToggle.push(pair.id);
    }

    const isSelected = selectedIds.has(id);

    idsToToggle.forEach((targetId) => {
      if (isSelected) newSelected.delete(targetId);
      else newSelected.add(targetId);
    });

    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    } else if (onDelete) {
      // Fallback to loop if no bulk handler
      selectedIds.forEach((id) => onDelete(id));
      setSelectedIds(new Set());
    }
  };

  // Safety check
  if (!accountCurrencyMap) {
    console.error(
      "ScheduledTransactionsTable: accountCurrencyMap is missing from context.",
    );
    return <div className="p-4 text-red-500">Error loading table context.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Bulk Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md animate-in slide-in-from-top-2">
          <span className="text-sm font-medium px-2">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            <Trash className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      )}

      <div className="rounded-md border bg-white/50 dark:bg-black/20 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    transactions.length > 0 &&
                    selectedIds.size === transactions.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">
                Next Date
              </TableHead>
              <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">
                Frequency
              </TableHead>
              <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">
                Vendor / Account
              </TableHead>
              <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">
                Category
              </TableHead>
              <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">
                Sub-category
              </TableHead>
              <TableHead className="text-right text-slate-800 dark:text-slate-200 font-semibold">
                Amount
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-10 text-slate-500"
                >
                  No scheduled transactions found.
                </TableCell>
              </TableRow>
            ) : (
              currentTransactions.map((transaction) => {
                // Defensive coding against incomplete data
                if (!transaction) return null;

                const currentAccountCurrency =
                  accountCurrencyMap.get(transaction.account) ||
                  transaction.currency ||
                  "USD";

                return (
                  <ContextMenu key={transaction.id || Math.random()}>
                    <ContextMenuTrigger asChild>
                      <TableRow
                        className={`group cursor-pointer hover:bg-muted/50 ${selectedIds.has(transaction.id) ? "bg-muted" : ""}`}
                        onDoubleClick={() => onEdit && onEdit(transaction)}
                      >
                        <TableCell
                          className="w-[40px]"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedIds.has(transaction.id)}
                            onCheckedChange={() => toggleSelect(transaction.id)}
                          />
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 font-medium">
                          {formatDateToDDMMYYYY(transaction.date)}
                        </TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                          {transaction.frequency || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {transaction.transfer_id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onUnlink)
                                    onUnlink(transaction.transfer_id!);
                                }}
                                className="mr-1 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors group/link"
                                title="Unlink Pair"
                              >
                                <Link className="h-3.5 w-3.5 text-blue-500 group-hover/link:text-red-500" />
                              </button>
                            )}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVendorClick(transaction.vendor);
                              }}
                              className="font-medium cursor-pointer hover:text-primary hover:underline text-slate-700 dark:text-slate-200"
                            >
                              {transaction.vendor || "Unknown"}
                            </span>
                          </div>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccountClick(transaction.account);
                            }}
                            className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary hover:underline"
                          >
                            {transaction.account || "Unknown"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryClick(transaction.category);
                            }}
                            className={`text-slate-700 dark:text-slate-300 ${transaction.category !== "Transfer" ? "cursor-pointer hover:border-primary" : ""}`}
                          >
                            {transaction.category || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.sub_category && (
                            <Badge
                              variant="outline"
                              className="text-xs text-slate-700 dark:text-slate-300 font-normal"
                            >
                              {transaction.sub_category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${transaction.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          {formatCurrency(
                            transaction.amount,
                            currentAccountCurrency,
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              {onProcessToday && (
                                <DropdownMenuItem
                                  onClick={() => onProcessToday(transaction)}
                                >
                                  <PlayCircle className="mr-2 h-4 w-4" /> Make
                                  happen today
                                </DropdownMenuItem>
                              )}
                              {onEdit && (
                                <DropdownMenuItem
                                  onClick={() => onEdit(transaction)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <DropdownMenuItem
                                  onClick={() => onDelete(transaction.id)}
                                  className="text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        inset
                        onClick={() => toggleSelect(transaction.id)}
                      >
                        {selectedIds.has(transaction.id)
                          ? "Deselect"
                          : "Select"}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      {onProcessToday && (
                        <ContextMenuItem
                          onClick={() => onProcessToday(transaction)}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" /> Make happen
                          today
                        </ContextMenuItem>
                      )}
                      <ContextMenuSeparator />
                      {onEdit && (
                        <ContextMenuItem onClick={() => onEdit(transaction)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </ContextMenuItem>
                      )}
                      {onDelete && (
                        <ContextMenuItem
                          onClick={() => onDelete(transaction.id)}
                          className="text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </ContextMenuItem>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={
                    currentPage === 1
                      ? undefined
                      : () => paginate(currentPage - 1)
                  }
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4 text-sm text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={
                    currentPage === totalPages
                      ? undefined
                      : () => paginate(currentPage + 1)
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
