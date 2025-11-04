import { useState, useMemo } from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ColumnDef } from '@tanstack/react-table';
import { Transaction } from '@/types/finance';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export const useTransactionManagement = () => {
  const { transactions: allTransactions, accountCurrencyMap, refetchTransactions } = useTransactions();
  const { formatCurrency } = useCurrency();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [columnVisibility, setColumnVisibility] = useState({});

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingTransaction(undefined);
    setIsDialogOpen(true);
  };

  const handleDelete = (ids: string[]) => {
    // This should be handled by a new function in the context
    console.log("Deleting transactions:", ids);
  };

  const handleImport = (file: File) => {
    // This should be handled by a new function in the context
    console.log("Importing file:", file.name);
  };

  const columns = useMemo<ColumnDef<Transaction>[]>(() => [
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => format(new Date(row.getValue('date')), 'MMM dd, yyyy') },
    { accessorKey: 'vendor', header: 'Payee' },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => <Badge variant="outline">{row.getValue('category')}</Badge> },
    { accessorKey: 'account', header: 'Account' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => {
      const currency = accountCurrencyMap.get(row.original.account) || 'USD';
      return formatCurrency(row.getValue('amount'), currency);
    }},
    { accessorKey: 'remarks', header: 'Remarks' },
  ], [formatCurrency, accountCurrencyMap]);

  return {
    filteredTransactions: allTransactions,
    columns,
    isDialogOpen,
    setIsDialogOpen,
    editingTransaction,
    handleEditTransaction,
    handleAddNew,
    handleDelete,
    handleImport,
    columnVisibility,
    setColumnVisibility,
    refetchTransactions,
  };
};