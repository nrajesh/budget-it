import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import RecentTransactions from '@/components/RecentTransactions';
import LoadingSpinner from '@/components/LoadingSpinner';
// ... other imports

const Transactions = () => {
  const { transactions, accountCurrencyMap, isLoadingTransactions, isLoadingVendors, isLoadingAccounts, isLoadingCategories } = useTransactions();
  const { formatCurrency } = useCurrency();

  if (isLoadingTransactions || isLoadingVendors || isLoadingAccounts || isLoadingCategories) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* ... other UI elements */}
      <RecentTransactions
        currentTransactions={transactions}
        accountCurrencyMap={accountCurrencyMap}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default Transactions;