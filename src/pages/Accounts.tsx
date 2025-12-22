import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Account } from '@/types/account';

const AccountsPage: React.FC = () => {
  const { accounts, isLoadingAccounts } = useTransactions();
  const { formatCurrency } = useCurrency();

  const columns = [
    {
      header: 'Name',
      accessor: (item: Account) => item.name,
    },
    {
      header: 'Starting Balance',
      accessor: (item: Account) => formatCurrency(item.starting_balance, item.currency),
    },
    {
      header: 'Running Balance',
      accessor: (item: Account) => formatCurrency(item.running_balance, item.currency),
    },
    // ... other columns
  ];

  // ... rest of the component implementation
};

export default AccountsPage;