"use client";

import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportOutletContextType } from './ReportLayout';
import { useCurrency } from '@/contexts/CurrencyContext';

const TrendsAndAnalytics = () => {
  const { combinedFilteredTransactions: transactions } = useOutletContext<ReportOutletContextType>();
  const { formatCurrency } = useCurrency();

  const transactionCount = transactions.length;
  const averageTransaction = transactionCount > 0 
    ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactionCount
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trends & Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Total Transactions Analyzed: {transactionCount}</p>
        <p>Average Transaction Amount: {formatCurrency(averageTransaction)}</p>
      </CardContent>
    </Card>
  );
};

export default TrendsAndAnalytics;