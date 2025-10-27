"use client";

import React from 'react';
import { useTransactionData } from '@/hooks/transactions/useTransactionData';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import { Transaction, Account, Vendor, Category } from '../../types/finance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface ReportData {
  historicalFilteredTransactions: Transaction[];
  futureFilteredTransactions: Transaction[];
  combinedFilteredTransactions: Transaction[];
  accounts: Account[] | undefined;
  vendors: Vendor[] | undefined;
  categories: Category[] | undefined;
  budgets: any[]; // Placeholder for budgets data
}

interface ReportLayoutProps {
  title: string;
  description: React.ReactNode;
  children: (data: ReportData) => React.ReactNode;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({ title, description, children }) => {
  const filterProps = useTransactionFilters();
  const dataProps = useTransactionData(filterProps);

  const { historicalFilteredTransactions, futureFilteredTransactions } = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const historical = dataProps.filteredTransactions.filter(t => new Date(t.date) <= today);
    const future = dataProps.filteredTransactions.filter(t => new Date(t.date) > today && t.is_scheduled_origin);
    return { historicalFilteredTransactions: historical, futureFilteredTransactions: future };
  }, [dataProps.filteredTransactions]);

  if (dataProps.isLoading) {
    return <div>Loading report data...</div>;
  }

  const reportData: ReportData = {
    historicalFilteredTransactions,
    futureFilteredTransactions,
    combinedFilteredTransactions: dataProps.filteredTransactions,
    accounts: dataProps.accounts,
    vendors: dataProps.vendors,
    categories: dataProps.categories,
    budgets: [], // Placeholder for budgets data
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
      {/* TODO: Add filter controls here, using filterProps */}
      {children(reportData)}
    </div>
  );
};

export default ReportLayout;