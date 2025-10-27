"use client";

import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { usePayeeManagement } from '@/hooks/usePayeeManagement';
import { PayeeTable } from '@/components/payees/PayeeTable';

const Vendors = () => {
  const { vendors, isLoadingVendors, invalidateAllData } = useTransactions();
  const managementProps = usePayeeManagement(false);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Vendors</h1>
      <PayeeTable
        entityName="vendor"
        entityNamePlural="vendors"
        data={vendors || []}
        isLoading={isLoadingVendors}
        {...managementProps}
      />
    </div>
  );
};

export default Vendors;