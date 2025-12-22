import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Transaction } from '@/types/transaction';

interface EditTransactionDialogProps {
  transaction: Transaction;
  onOpenChange: (open: boolean) => void;
}

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  transaction,
  onOpenChange
}) => {
  const {
    updateTransaction,
    deleteTransaction,
    accountCurrencyMap,
    categories: allCategories,
    accounts,
    vendors,
    isLoadingAccounts,
    isLoadingVendors,
    isLoadingCategories
  } = useTransactions();

  const { formatCurrency } = useCurrency();

  return <div>Edit Transaction Dialog Content</div>;
};