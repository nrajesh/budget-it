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

  return <div>Scheduled Transactions Page Content</div>;
};

export default ScheduledTransactionsPage;