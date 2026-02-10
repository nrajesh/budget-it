
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

interface TransactionTableProps {
  transactions: any[];
  loading: boolean;
  onRefresh: () => void;
  onDeleteTransactions: (transactions: { id: string, transfer_id?: string }[]) => void;
  onAddTransaction: (transaction: any) => void;
  onRowDoubleClick?: (transaction: any, event: React.MouseEvent) => void;
  onScheduleTransactions?: (transactions: any[], clearSelection: () => void) => void;
  onUnlinkTransaction?: (transferId: string) => void;
  onLinkTransactions?: (id1: string, id2: string) => void;
  accountCurrencyMap?: Map<string, string>;
}

// Memoized Row Component
const TransactionRow = React.memo(({
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
  toast
}: {
  transaction: any;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRowDoubleClick?: (transaction: any, event: React.MouseEvent) => void;
  onUnlinkTransaction?: (transferId: string) => void;
  onAddTransaction: (transaction: any) => void;
  onScheduleTransactions?: (transactions: any[], clearSelection: () => void) => void;
  onDeleteTransactions: (transactions: { id: string, transfer_id?: string }[]) => void;
  accountCurrencyMap?: Map<string, string>;
  selectedCurrency: string;
  today: Date;
  navigate: any;
  toast: any;
}) => {

  const isFuture = useMemo(() => {
    const txnDate = new Date(transaction.date);
    txnDate.setHours(0, 0, 0, 0);
    return txnDate > today;
  }, [transaction.date, today]);

  const renderCell = (field: string, value: any) => {
    return (
      <span className="cursor-pointer">
        {field === 'amount'
          ? value.toLocaleString(undefined, {
            style: 'currency',
            currency: (accountCurrencyMap?.get(transaction.account) || transaction.currency || selectedCurrency)
          })
          : field === 'date'
            ? new Date(value).toLocaleDateString()
            : (value || "-")
        }
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
          <TableCell className="w-[40px] px-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
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
                    if (onUnlinkTransaction) onUnlinkTransaction(transaction.transfer_id);
                  }}
                >
                  <Link className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400 group-hover/link:text-red-500" />
                </button>
              )}
            </div>
          </TableCell>
          <TableCell className="text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              {renderCell('date', transaction.date)}
              {transaction.is_scheduled_origin && (
                <span
                  title="Go to Scheduled Transaction"
                  className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full p-1 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (transaction.recurrence_id) {
                      navigate(`/scheduled?id=${transaction.recurrence_id}`);
                    } else {
                      toast({ title: "Reference Missing", description: "Could not find the original scheduled transaction.", variant: "destructive" });
                    }
                  }}
                >
                  <CalendarClock className="h-4 w-4 text-blue-500" />
                </span>
              )}
            </div>
          </TableCell>
          <TableCell className="text-slate-700 dark:text-slate-300 font-medium">{renderCell('category', transaction.category)}</TableCell>
          <TableCell className="text-slate-700 dark:text-slate-300">{renderCell('sub_category', transaction.sub_category)}</TableCell>
          <TableCell className="text-slate-700 dark:text-slate-300">{renderCell('vendor', transaction.vendor)}</TableCell>
          <TableCell className="text-slate-700 dark:text-slate-300">{renderCell('account', transaction.account)}</TableCell>
          <TableCell className="max-w-[200px] truncate text-slate-600 dark:text-slate-400" title={transaction.remarks}>
            {renderCell('remarks', transaction.remarks)}
          </TableCell>
          <TableCell className={`text-right font-medium ${transaction.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {renderCell('amount', transaction.amount)}
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
            <ContextMenuItem inset onClick={(e) => onRowDoubleClick && onRowDoubleClick(transaction, e)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem inset onClick={() => onScheduleTransactions && onScheduleTransactions([transaction], () => { })}>
          <CalendarClock className="h-4 w-4 mr-2" /> {transaction.recurrence_id ? "Edit Schedule" : "Schedule"}
        </ContextMenuItem>
        <ContextMenuItem inset onClick={() => onAddTransaction({
          ...transaction,
          id: undefined,
          created_at: undefined,
          remarks: transaction.remarks + " (Copy)",
          recurrence_id: undefined,
          is_scheduled_origin: undefined,
          is_projected: undefined,
          frequency: undefined,
          recurrence_end_date: undefined
        })}>
          <Copy className="h-4 w-4 mr-2" /> Duplicate
        </ContextMenuItem>
        <ContextMenuItem inset className="text-red-600" onClick={() => onDeleteTransactions([{ id: transaction.id }])}>
          <Trash className="h-4 w-4 mr-2" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

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

  // Use the sorting hook
  const { sortedData, sortConfig, handleHeaderClick, handleHeaderRightClick } = useTableSort({
    data: transactions,
    initialSort: { key: 'date', direction: 'desc' } // Default sort by date descending seems appropriate for transactions
  });

  // Selection Handlers
  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === sortedData.length) {
        return new Set();
      } else {
        return new Set(sortedData.map(t => t.id));
      }
    });
  }, [sortedData]);

  const toggleSelect = useCallback((id: string) => {
    // Determine linked IDs first (stable logic, but depends on sortedData array)
    // Finding the transaction inside the callback ensures we use the latest 'sortedData'
    const txn = sortedData.find(t => t.id === id);
    const idsToToggle = [id];

    if (txn?.transfer_id) {
      sortedData.forEach(t => {
        if (t.transfer_id === txn.transfer_id && t.id !== id) {
          idsToToggle.push(t.id);
        }
      });
    }

    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      // Determine if we are selecting or deselecting based on the PRIMARY id
      const isSelected = prev.has(id);

      idsToToggle.forEach(targetId => {
        if (isSelected) {
          newSelected.delete(targetId);
        } else {
          newSelected.add(targetId);
        }
      });

      return newSelected;
    });
  }, [sortedData]);


  // Bulk Actions
  const handleBulkDelete = () => {
    const toDelete = sortedData
      .filter(t => selectedIds.has(t.id))
      .map(t => ({ id: t.id, transfer_id: t.transfer_id }));

    onDeleteTransactions(toDelete);
    setSelectedIds(new Set());
  };

  const handleBulkDuplicate = () => {
    const toDuplicate = sortedData.filter(t => selectedIds.has(t.id));
    toDuplicate.forEach(t => {
      onAddTransaction({
        ...t,
        id: undefined,
        created_at: undefined,
        date: new Date().toISOString(),
        remarks: `${t.remarks} (Copy)`,
        recurrence_id: undefined,
        is_scheduled_origin: undefined,
        is_projected: undefined,
        frequency: undefined,
        recurrence_end_date: undefined
      });
    });
    setSelectedIds(new Set());
    toast({ title: "Duplicated", description: `${toDuplicate.length} transactions duplicated.` });
  };

  const handleBulkSchedule = () => {
    const toSchedule = sortedData.filter(t => selectedIds.has(t.id));
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

  return (
    <div className="space-y-2">
      {/* Bulk Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md animate-in slide-in-from-top-2">
          <span className="text-sm font-medium px-2">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-border" />
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}><X className="h-4 w-4 mr-1" /> Clear</Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}><Trash className="h-4 w-4 mr-1" /> Delete</Button>
          <Button size="sm" variant="secondary" onClick={handleBulkDuplicate}><Copy className="h-4 w-4 mr-1" /> Duplicate</Button>
          <Button size="sm" variant="secondary" onClick={handleBulkSchedule}><CalendarClock className="h-4 w-4 mr-1" /> Schedule</Button>
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
                  checked={selectedIds.size === sortedData.length && sortedData.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <SortableHeader label="Date" sortKey="date" sortConfig={sortConfig} onSort={handleHeaderClick} onReset={handleHeaderRightClick} />
              <SortableHeader label="Category" sortKey="category" sortConfig={sortConfig} onSort={handleHeaderClick} onReset={handleHeaderRightClick} className="text-slate-800 dark:text-slate-200 font-semibold" />
              <SortableHeader label="Sub-category" sortKey="sub_category" sortConfig={sortConfig} onSort={handleHeaderClick} onReset={handleHeaderRightClick} className="text-slate-800 dark:text-slate-200 font-semibold" />
              <SortableHeader label="Payee" sortKey="vendor" sortConfig={sortConfig} onSort={handleHeaderClick} onReset={handleHeaderRightClick} className="text-slate-800 dark:text-slate-200 font-semibold" />
              <SortableHeader label="Account" sortKey="account" sortConfig={sortConfig} onSort={handleHeaderClick} onReset={handleHeaderRightClick} className="text-slate-800 dark:text-slate-200 font-semibold" />
              <SortableHeader label="Notes" sortKey="remarks" sortConfig={sortConfig} onSort={handleHeaderClick} onReset={handleHeaderRightClick} className="text-slate-800 dark:text-slate-200 font-semibold" />
              <SortableHeader label="Amount" sortKey="amount" sortConfig={sortConfig} onSort={handleHeaderClick} onReset={handleHeaderRightClick} className="text-right text-slate-800 dark:text-slate-200 font-semibold" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((transaction) => (
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
    </div>
  );
};

export default TransactionTable;
