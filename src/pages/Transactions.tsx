import React from 'react';
import { useTransactionManagement } from '@/hooks/useTransactionManagement.tsx';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { Transaction } from '@/types/finance';
import { useTransactions } from '@/contexts/TransactionsContext';

const Transactions: React.FC = () => {
  const {
    filteredTransactions,
    columns,
    isDialogOpen,
    setIsDialogOpen,
    editingTransaction,
    handleDelete,
    handleImport,
    handleAddNew,
    columnVisibility,
    setColumnVisibility,
  } = useTransactionManagement();

  const { isLoadingTransactions, isLoadingVendors, isLoadingAccounts, isLoadingCategories } = useTransactions();

  const isLoading = isLoadingTransactions || isLoadingVendors || isLoadingAccounts || isLoadingCategories;

  return (
    <TransactionTable
      transactions={filteredTransactions as Transaction[]}
      columns={columns}
      onAddNew={handleAddNew}
      onDelete={handleDelete}
      onImport={handleImport}
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      editingTransaction={editingTransaction}
      isLoading={isLoading}
      columnVisibility={columnVisibility}
      setColumnVisibility={setColumnVisibility}
    />
  );
};

export default Transactions;