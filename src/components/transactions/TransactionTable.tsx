import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead, // Keep for non-sortable headers like Checkbox column
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash, Copy, X, CalendarClock, Pencil, Link } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/ui/sortable-header";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Transaction } from "@/types/dataProvider";

interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
  onRefresh: () => void;
  onDeleteTransactions: (
    transactions: { id: string; transfer_id?: string }[],
  ) => void;
  onAddTransaction: (
    transaction: Omit<Transaction, "id" | "created_at">,
  ) => void;
  onRowDoubleClick?: (
    transaction: Transaction,
    event: React.MouseEvent,
  ) => void;
  onScheduleTransactions?: (
    transactions: Transaction[],
    clearSelection: () => void,
  ) => void;
  onUnlinkTransaction?: (transferId: string) => void;
  onLinkTransactions?: (id1: string, id2: string) => void;
  accountCurrencyMap?: Map<string, string>;
}

// Memoized Row Component
const TransactionRow = React.memo(
  ({
    transaction,
    isSelected,
    onToggleSelect,
    onRowDoubleClick,
    onUnlinkTransaction,
    onAddTransaction,
    onScheduleTransactions,
    onDeleteTransactions,
    accountCurrencyMap,
    selectedCurrency,
    today,
    navigate,
    toast,
  }: {
    transaction: Transaction;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onRowDoubleClick?: (
      transaction: Transaction,
      event: React.MouseEvent,
    ) => void;
    onUnlinkTransaction?: (transferId: string) => void;
    onAddTransaction: (
      transaction: Omit<Transaction, "id" | "created_at">,
    ) => void;
    onScheduleTransactions?: (
      transactions: Transaction[],
      clearSelection: () => void,
    ) => void;
    onDeleteTransactions: (
      transactions: { id: string; transfer_id?: string }[],
    ) => void;
    accountCurrencyMap?: Map<string, string>;
    selectedCurrency: string;
    today: Date;
    navigate: any; // useNavigate return type is hard to import? It's `NavigateFunction`.
    toast: any; // `useToast` return type.
  }) => {
    const isFuture = useMemo(() => {
      const txnDate = new Date(transaction.date);
      txnDate.setHours(0, 0, 0, 0);
      return txnDate > today;
    }, [transaction.date, today]);

    const renderCell = (field: string, value: unknown) => {
      return (
        <span className="cursor-pointer">
          {field === "amount"
            ? (value as number).toLocaleString(undefined, {
                style: "currency",
                currency:
                  accountCurrencyMap?.get(transaction.account) ||
                  transaction.currency ||
                  selectedCurrency,
              })
            : field === "date"
              ? new Date(value as string).toLocaleDateString()
              : (value as React.ReactNode) || "-"}
        </span>
      );
    };

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <TableRow
            data-state={isSelected ? "selected" : undefined}
            className={`group ${isSelected ? "bg-muted" : ""} cursor-pointer hover:bg-muted/50 ${isFuture ? "opacity-70 italic text-slate-500 bg-slate-50/50 dark:bg-slate-900/50" : ""}`}
            onDoubleClick={(e) => {
              if (onRowDoubleClick && !transaction.is_projected) {
                onRowDoubleClick(transaction, e);
              }
            }}
          >
            <TableCell
              className="w-[40px] px-2"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(transaction.id)}
                />
                {transaction.transfer_id && (
                  <button
                    className="h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 group/link transition-colors"
                    title="Unlink Transfer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUnlinkTransaction && transaction.transfer_id)
                        onUnlinkTransaction(transaction.transfer_id);
                    }}
                  >
                    <Link className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400 group-hover/link:text-red-500" />
                  </button>
                )}
              </div>
            </TableCell>
            <TableCell className="text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                {renderCell("date", transaction.date)}
                {transaction.is_scheduled_origin && (
                  <span
                    title="Go to Scheduled Transaction"
                    className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full p-1 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (transaction.recurrence_id) {
                        navigate(`/scheduled?id=${transaction.recurrence_id}`);
                      } else {
                        toast({
                          title: "Reference Missing",
                          description:
                            "Could not find the original scheduled transaction.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <CalendarClock className="h-4 w-4 text-blue-500" />
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-slate-700 dark:text-slate-300 font-medium">
              {renderCell("category", transaction.category)}
            </TableCell>
            <TableCell className="text-slate-700 dark:text-slate-300">
              {renderCell("sub_category", transaction.sub_category)}
            </TableCell>
            <TableCell className="text-slate-700 dark:text-slate-300">
              {renderCell("vendor", transaction.vendor)}
            </TableCell>
            <TableCell className="text-slate-700 dark:text-slate-300">
              {renderCell("account", transaction.account)}
            </TableCell>
            <TableCell
              className="max-w-[200px] truncate text-slate-600 dark:text-slate-400"
              title={transaction.remarks || ""}
            >
              {renderCell("remarks", transaction.remarks)}
            </TableCell>
            <TableCell
              className={`text-right font-medium ${transaction.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
            >
              {renderCell("amount", transaction.amount)}
            </TableCell>
          </TableRow>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem inset onClick={() => onToggleSelect(transaction.id)}>
            {isSelected ? "Deselect" : "Select"}
          </ContextMenuItem>
          <ContextMenuSeparator />
          {!transaction.is_projected && (
            <>
              <ContextMenuItem
                inset
                onClick={(e) =>
                  onRowDoubleClick && onRowDoubleClick(transaction, e)
                }
              >
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem
            inset
            onClick={() =>
              onScheduleTransactions &&
              onScheduleTransactions([transaction], () => {})
            }
          >
            <CalendarClock className="h-4 w-4 mr-2" />{" "}
            {transaction.recurrence_id ? "Edit Schedule" : "Schedule"}
          </ContextMenuItem>
          <ContextMenuItem
            inset
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { id, created_at, ...rest } = transaction;
              onAddTransaction({
                ...rest,
                remarks: transaction.remarks + " (Copy)",
                recurrence_id: undefined,
                is_scheduled_origin: undefined,
                is_projected: undefined,
                recurrence_frequency: undefined,
                recurrence_end_date: undefined,
              });
            }}
          >
            <Copy className="h-4 w-4 mr-2" /> Duplicate
          </ContextMenuItem>
          <ContextMenuItem
            inset
            className="text-red-600"
            onClick={() => onDeleteTransactions([{ id: transaction.id }])}
          >
            <Trash className="h-4 w-4 mr-2" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
);

TransactionRow.displayName = "TransactionRow";

const TransactionTable = ({
  transactions,
  loading,
  onDeleteTransactions,
  onAddTransaction,
  onScheduleTransactions,
  onRowDoubleClick,
  onUnlinkTransaction,
  onLinkTransactions,
  accountCurrencyMap,
}: TransactionTableProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { selectedCurrency } = useCurrency();
  const navigate = useNavigate();

  // Optimization: Calculate today once per render
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination when data length changes (e.g. filters applied)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [transactions.length]);

  // Use the sorting hook
  const { sortedData, sortConfig, handleHeaderClick, handleHeaderRightClick } =
    useTableSort({
      data: transactions,
      initialSort: { key: "date", direction: "desc" },
    });

  // Calculate Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const offset = (currentPage - 1) * pageSize;
  const paginatedData = useMemo(
    () => sortedData.slice(offset, offset + pageSize),
    [sortedData, offset, pageSize],
  );

  // Selection Handlers (Updated for Pagination)
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const currentIds = paginatedData.map((t) => t.id);
      const allSelected = currentIds.every((id) => prev.has(id));

      const newSet = new Set(prev);
      if (allSelected) {
        currentIds.forEach((id) => newSet.delete(id));
      } else {
        currentIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  }, [paginatedData]);

  const toggleSelect = useCallback(
    (id: string) => {
      // Determine linked IDs first
      const txn = sortedData.find((t) => t.id === id);
      const idsToToggle = [id];

      if (txn?.transfer_id) {
        sortedData.forEach((t) => {
          if (t.transfer_id === txn.transfer_id && t.id !== id) {
            idsToToggle.push(t.id);
          }
        });
      }

      setSelectedIds((prev) => {
        const newSelected = new Set(prev);
        const isSelected = prev.has(id);

        idsToToggle.forEach((targetId) => {
          if (isSelected) {
            newSelected.delete(targetId);
          } else {
            newSelected.add(targetId);
          }
        });

        return newSelected;
      });
    },
    [sortedData],
  );

  // Bulk Actions
  const handleBulkDelete = () => {
    const toDelete = sortedData
      .filter((t) => selectedIds.has(t.id))
      .map((t) => ({ id: t.id, transfer_id: t.transfer_id || undefined }));

    onDeleteTransactions(toDelete);
    setSelectedIds(new Set());
  };

  const handleBulkDuplicate = () => {
    const toDuplicate = sortedData.filter((t) => selectedIds.has(t.id));
    toDuplicate.forEach((t) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, ...rest } = t;
      onAddTransaction({
        ...rest,
        date: new Date().toISOString(),
        remarks: `${t.remarks} (Copy)`,
        recurrence_id: undefined,
        is_scheduled_origin: undefined,
        is_projected: undefined,
      });
    });
    setSelectedIds(new Set());
    toast({
      title: "Duplicated",
      description: `${toDuplicate.length} transactions duplicated.`,
    });
  };

  const handleBulkSchedule = () => {
    const toSchedule = sortedData.filter((t) => selectedIds.has(t.id));
    if (onScheduleTransactions) {
      onScheduleTransactions(toSchedule, () => setSelectedIds(new Set()));
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  // Helper to check if all current page items are selected
  const allCurrentPageSelected =
    paginatedData.length > 0 &&
    paginatedData.every((t) => selectedIds.has(t.id));

  return (
    <div className="space-y-4">
      {/* Bulk Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md animate-in slide-in-from-top-2 sticky top-0 z-10 backdrop-blur-sm">
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
          <Button size="sm" variant="secondary" onClick={handleBulkDuplicate}>
            <Copy className="h-4 w-4 mr-1" /> Duplicate
          </Button>
          <Button size="sm" variant="secondary" onClick={handleBulkSchedule}>
            <CalendarClock className="h-4 w-4 mr-1" /> Schedule
          </Button>
          {selectedIds.size === 2 && onLinkTransactions && (
            <Button
              size="sm"
              variant="default" // Use default variant to highlight this action
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                const ids = Array.from(selectedIds);
                if (ids.length === 2 && onLinkTransactions) {
                  onLinkTransactions(ids[0], ids[1]);
                  setSelectedIds(new Set()); // Clear selection after linking
                }
              }}
            >
              <Link className="h-4 w-4 mr-1" /> Link Pair
            </Button>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allCurrentPageSelected}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <SortableHeader
                label="Date"
                sortKey="date"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
              />
              <SortableHeader
                label="Category"
                sortKey="category"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
                className="text-slate-800 dark:text-slate-200 font-semibold"
              />
              <SortableHeader
                label="Sub-category"
                sortKey="sub_category"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
                className="text-slate-800 dark:text-slate-200 font-semibold"
              />
              <SortableHeader
                label="Payee"
                sortKey="vendor"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
                className="text-slate-800 dark:text-slate-200 font-semibold"
              />
              <SortableHeader
                label="Account"
                sortKey="account"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
                className="text-slate-800 dark:text-slate-200 font-semibold"
              />
              <SortableHeader
                label="Notes"
                sortKey="remarks"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
                className="text-slate-800 dark:text-slate-200 font-semibold"
              />
              <SortableHeader
                label="Amount"
                sortKey="amount"
                sortConfig={sortConfig}
                onSort={handleHeaderClick}
                onSortReset={handleHeaderRightClick}
                className="text-right text-slate-800 dark:text-slate-200 font-semibold"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-10 text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  isSelected={selectedIds.has(transaction.id)}
                  onToggleSelect={toggleSelect}
                  onRowDoubleClick={onRowDoubleClick}
                  onUnlinkTransaction={onUnlinkTransaction}
                  onAddTransaction={onAddTransaction}
                  onScheduleTransactions={onScheduleTransactions}
                  onDeleteTransactions={onDeleteTransactions}
                  accountCurrencyMap={accountCurrencyMap}
                  selectedCurrency={selectedCurrency}
                  today={today}
                  navigate={navigate}
                  toast={toast}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground order-2 sm:order-1">
            <span>Rows per page</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1); // Reset to first page when changing size
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-4 w-px bg-border mx-2" />
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <Pagination className="justify-end w-auto order-1 sm:order-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationFirst
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>

              {/* Simple Page Indicator / Jumper could go here, but focusing on Nav controls for now */}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLast
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
