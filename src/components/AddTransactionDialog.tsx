import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/hooks/useCurrency';

interface AddTransactionDialogProps {
  onOpenChange: (open: boolean) => void;
}

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  onOpenChange
}) => {
  const {
    addTransaction,
    accountCurrencyMap,
    categories: allCategories,
    accounts,
    vendors,
    isLoadingAccounts,
    isLoadingVendors,
    isLoadingCategories
  } = useTransactions();

  const { formatCurrency } = useCurrency();

  return <div>Add Transaction Dialog Content</div>;
};