"use client";

import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePayeeManagement } from '@/hooks/usePayeeManagement';
import { PayeeTable } from '@/components/payees/PayeeTable';

const Accounts = () => {
  const { accounts, isLoadingAccounts, invalidateAllData } = useTransactions();
  const { formatCurrency } = useCurrency();
  const managementProps = usePayeeManagement(true);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Accounts</h1>
      <PayeeTable
        entityName="account"
        entityNamePlural="accounts"
        data={accounts || []}
        isLoading={isLoadingAccounts}
        {...managementProps}
      />
    </div>
  );
};

export default Accounts;