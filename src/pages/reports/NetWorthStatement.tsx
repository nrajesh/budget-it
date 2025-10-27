"use client";

import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportOutletContextType } from './ReportLayout';
import { useCurrency } from '@/contexts/CurrencyContext';

const NetWorthStatement = () => {
  const { accounts } = useOutletContext<ReportOutletContextType>();
  const { formatCurrency } = useCurrency();

  if (!accounts) return <div>Loading accounts...</div>;

  const totalAssets = accounts
    .filter(acc => acc.running_balance >= 0)
    .reduce((sum, acc) => sum + acc.running_balance, 0);

  const totalLiabilities = accounts
    .filter(acc => acc.running_balance < 0)
    .reduce((sum, acc) => sum + acc.running_balance, 0);
    
  const netWorth = totalAssets + totalLiabilities;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Statement</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Total Assets: {formatCurrency(totalAssets)}</p>
        <p>Total Liabilities: {formatCurrency(Math.abs(totalLiabilities))}</p>
        <p className="font-bold">Net Worth: {formatCurrency(netWorth)}</p>
      </CardContent>
    </Card>
  );
};

export default NetWorthStatement;