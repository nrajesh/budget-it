import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';

const ScheduledTransactionsPage: React.FC = () => {
  const {
    scheduledTransactions,
    isLoadingScheduledTransactions,
    accounts,
    vendors,
    isLoadingAccounts,
    isLoadingVendors
  } = useTransactions();

  // ... rest of the component implementation
};

export default ScheduledTransactionsPage;