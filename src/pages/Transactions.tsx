import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';

const TransactionsPage: React.FC = () => {
  // Destructure loading states directly from useTransactions
  const {
    isLoadingTransactions,
    isLoadingVendors,
    isLoadingAccounts,
    isLoadingCategories
  } = useTransactions();

  // ... rest of the component implementation
};

export default TransactionsPage;