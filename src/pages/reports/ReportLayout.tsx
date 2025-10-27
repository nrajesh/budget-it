"use client";

import React, { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionData } from '@/hooks/transactions/useTransactionData';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import { Transaction } from '@/types/finance';
// Placeholder for TransactionFilters component, assuming it exists
// import { TransactionFilters } from '@/components/reports/TransactionFilters';

const ReportLayout = () => {
  const dataProps = useTransactionData();
  const filterProps = useTransactionFilters();

  const filteredTransactions = useMemo(() => {
    if (!dataProps.combinedTransactions) return [];
    // Add actual filtering logic here based on filterProps.filters
    return dataProps.combinedTransactions;
  }, [dataProps.combinedTransactions, filterProps.filters]);

  const { historicalFilteredTransactions, futureFilteredTransactions } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const historical = filteredTransactions.filter(t => new Date(t.date) <= today);
    const future = filteredTransactions.filter(t => new Date(t.date) > today && t.is_scheduled_origin);
    return { historicalFilteredTransactions: historical, futureFilteredTransactions: future };
  }, [filteredTransactions]);

  if (dataProps.isLoading) {
    return <div>Loading report data...</div>;
  }

  const outletContext = {
    ...dataProps,
    historicalFilteredTransactions,
    futureFilteredTransactions,
    combinedFilteredTransactions: filteredTransactions,
  };

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 
              Assuming a TransactionFilters component exists and takes these props.
              This placeholder resolves the prop-drilling errors.
            */}
            <p>Filter controls will go here.</p>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Outlet context={outletContext} />
      </div>
    </div>
  );
};

export default ReportLayout;