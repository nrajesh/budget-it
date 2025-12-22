import React, { useMemo, useState } from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Transaction } from '@/types/transaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BalanceOverTimeChart from '@/components/charts/BalanceOverTimeChart';
import SpendingCategoriesChart from '@/components/charts/SpendingCategoriesChart';
import RecentTransactions from '@/components/RecentTransactions';
import { slugify } from '@/utils/slugify';

const AnalyticsPage: React.FC = () => {
  const { transactions, isLoadingTransactions } = useTransactions();
  const { selectedCurrency } = useCurrency();

  // Placeholder filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const dateRange = { from: new Date(2023, 0, 1), to: new Date() };

  const currentTransactions = transactions; // Use all transactions for initial data

  const filteredTransactions = useMemo(() => {
    let filtered = currentTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    });

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    if (selectedAccounts.length > 0) {
      filtered = filtered.filter(t => selectedAccounts.includes(slugify(t.account)));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(slugify(t.category)));
    }

    if (lowerCaseSearchTerm) {
      filtered = filtered.filter(t =>
        t.vendor?.toLowerCase().includes(lowerCaseSearchTerm) ||
        t.category.toLowerCase().includes(lowerCaseSearchTerm) ||
        t.remarks?.toLowerCase().includes(lowerCaseSearchTerm) ||
        t.account.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    return filtered;
  }, [currentTransactions, dateRange, selectedAccounts, selectedCategories, searchTerm]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      
      {isLoadingTransactions ? (
        <p>Loading transactions...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BalanceOverTimeChart transactions={filteredTransactions} />
          </div>
          <div className="lg:col-span-1">
            <SpendingCategoriesChart transactions={filteredTransactions} />
          </div>
        </div>
      )}

      <RecentTransactions transactions={filteredTransactions} selectedCategories={selectedCategories} />
    </div>
  );
};

export default AnalyticsPage;