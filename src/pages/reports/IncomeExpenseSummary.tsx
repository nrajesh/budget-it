"use client";

import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportOutletContextType } from './ReportLayout';
import { useCurrency } from '@/contexts/CurrencyContext';

const IncomeExpenseSummary = () => {
  const { combinedFilteredTransactions: transactions } = useOutletContext<ReportOutletContextType>();
  const { formatCurrency } = useCurrency();

  const income = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs. Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Total Income: {formatCurrency(income)}</p>
        <p>Total Expenses: {formatCurrency(Math.abs(expenses))}</p>
        <p className="font-bold">Net: {formatCurrency(income + expenses)}</p>
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseSummary;