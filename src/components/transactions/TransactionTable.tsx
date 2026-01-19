
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash, Copy, X, Check, CalendarClock } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useCurrency } from "@/contexts/CurrencyContext";

interface TransactionTableProps {
  transactions: any[];
  loading: boolean;
  onRefresh: () => void;
  accounts: any[];
  vendors: any[];
  categories: any[];
  onUpdateTransaction: (transaction: any) => void;
  onDeleteTransactions: (transactions: { id: string, transfer_id?: string }[]) => void;
  onAddTransaction: (transaction: any) => void;
  onRowDoubleClick?: (transaction: any, event: React.MouseEvent) => void;
  onScheduleTransactions?: (transactions: any[], clearSelection: () => void) => void;
}

const TransactionTable = ({
  transactions,
  loading,
  accounts = [],
  vendors = [],
  categories = [],
  onUpdateTransaction,
  onDeleteTransactions,
  onAddTransaction,
  onScheduleTransactions,
  onRowDoubleClick,
}: TransactionTableProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { selectedCurrency } = useCurrency();

  // Prepare options for Combobox
  const accountOptions = accounts.map(acc => ({ value: acc.name, label: acc.name })).sort((a, b) => a.label.localeCompare(b.label));
  const vendorOptions = vendors.map(ven => ({ value: ven.name, label: ven.name })).sort((a, b) => a.label.localeCompare(b.label));
  const categoryOptions = categories.map(cat => ({ value: cat.name, label: cat.name })).sort((a, b) => a.label.localeCompare(b.label));
  const subCategoryOptions = React.useMemo(() => {
    const subs = new Set<string>();
    transactions.forEach(t => {
      if (t.sub_category) subs.add(t.sub_category);
    });
    return Array.from(subs).sort().map(s => ({ value: s, label: s }));
  }, [transactions]);


  // Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };





  // Bulk Actions
  const handleBulkDelete = () => {
    const toDelete = transactions
      .filter(t => selectedIds.has(t.id))
      .map(t => ({ id: t.id, transfer_id: t.transfer_id }));

    onDeleteTransactions(toDelete);
    setSelectedIds(new Set());
    toast({ title: "Deleted", description: `${toDelete.length} transactions deleted.` });
  };

  const handleBulkDuplicate = () => {
    const toDuplicate = transactions.filter(t => selectedIds.has(t.id));
    toDuplicate.forEach(t => {
      onAddTransaction({
        ...t,
        id: undefined,
        created_at: undefined,
        date: new Date().toISOString(), // Duplicate to today? Or keep date? Let's use today to be safe
        remarks: `${t.remarks} (Copy)`
      });
    });
    setSelectedIds(new Set());
    toast({ title: "Duplicated", description: `${toDuplicate.length} transactions duplicated.` });
  };

  const handleBulkSchedule = () => {
    const toSchedule = transactions.filter(t => selectedIds.has(t.id));
    if (onScheduleTransactions) {
      onScheduleTransactions(toSchedule, () => setSelectedIds(new Set()));
    }
  };

  const renderCell = (transaction: any, field: string, value: any) => {
    return (
      <span className="cursor-pointer">
        {field === 'amount'
          ? value.toLocaleString(undefined, { style: 'currency', currency: transaction.currency || selectedCurrency })
          : field === 'date'
            ? new Date(value).toLocaleDateString()
            : (value || "-")
        }
      </span>
    );
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
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedIds.size === transactions.length && transactions.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sub-category</TableHead>
              <TableHead>Payee</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <ContextMenu key={transaction.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow
                      data-state={selectedIds.has(transaction.id) ? "selected" : undefined}
                      className={`group ${selectedIds.has(transaction.id) ? "bg-muted" : ""} cursor-pointer hover:bg-muted/50`}
                      onDoubleClick={(e) => {
                        if (onRowDoubleClick) {
                          onRowDoubleClick(transaction, e);
                        }
                      }}
                    >
                      <TableCell className="w-[40px]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(transaction.id)}
                          onCheckedChange={() => toggleSelect(transaction.id)}
                        />
                      </TableCell>
                      <TableCell>{renderCell(transaction, 'date', transaction.date)}</TableCell>
                      <TableCell>{renderCell(transaction, 'category', transaction.category)}</TableCell>
                      <TableCell>{renderCell(transaction, 'sub_category', transaction.sub_category)}</TableCell>
                      <TableCell>{renderCell(transaction, 'vendor', transaction.vendor)}</TableCell>
                      <TableCell>{renderCell(transaction, 'account', transaction.account)}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={transaction.remarks}>
                        {renderCell(transaction, 'remarks', transaction.remarks)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {renderCell(transaction, 'amount', transaction.amount)}
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-64">
                    <ContextMenuItem inset onClick={() => toggleSelect(transaction.id)}>
                      {selectedIds.has(transaction.id) ? "Deselect" : "Select"}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuSeparator />
                    <ContextMenuSub>
                      <ContextMenuSubTrigger inset>Quick Edit</ContextMenuSubTrigger>
                      <ContextMenuSubContent className="w-48">
                        <ContextMenuItem onClick={() => { startEditing(transaction); }}>
                          Edit Date
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => { startEditing(transaction); }}>
                          Edit Category
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => { startEditing(transaction); }}>
                          Edit Sub-category
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => { startEditing(transaction); }}>
                          Edit Payee
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => { startEditing(transaction); }}>
                          Edit Account
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => { startEditing(transaction); }}>
                          Edit Amount
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => { startEditing(transaction); }}>
                          Edit Notes
                        </ContextMenuItem>
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSeparator />
                    <ContextMenuItem inset onClick={() => onScheduleTransactions && onScheduleTransactions([transaction], () => { })}>
                      <CalendarClock className="h-4 w-4 mr-2" /> Schedule
                    </ContextMenuItem>
                    <ContextMenuItem inset onClick={() => onAddTransaction({ ...transaction, id: undefined, created_at: undefined, remarks: transaction.remarks + " (Copy)" })}>
                      <Copy className="h-4 w-4 mr-2" /> Duplicate
                    </ContextMenuItem>
                    <ContextMenuItem inset className="text-red-600" onClick={() => onDeleteTransactions([{ id: transaction.id }])}>
                      <Trash className="h-4 w-4 mr-2" /> Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionTable;