import React from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Trash2 } from 'lucide-react';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { EditTransactionDialog } from '@/components/EditTransactionDialog';
import { Transaction } from '@/types/finance';

interface TransactionTableProps {
  transactions: Transaction[];
  columns: ColumnDef<Transaction, any>[];
  onAddNew: () => void;
  onDelete: (ids: string[]) => void;
  onImport: (file: File) => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  editingTransaction?: Transaction;
  isLoading: boolean;
  columnVisibility: any;
  setColumnVisibility: (visibility: any) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  columns,
  onAddNew,
  onDelete,
  onImport,
  isDialogOpen,
  setIsDialogOpen,
  editingTransaction,
  isLoading,
}) => {
  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">View and manage all your transactions.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={onAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".csv"
          />
        </div>
      </header>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Loading...</TableCell></TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No transactions found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {editingTransaction ? (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      ) : (
        <AddTransactionDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </div>
  );
};