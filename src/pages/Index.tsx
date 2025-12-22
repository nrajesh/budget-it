import React, { useMemo } from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Transaction } from '@/types/transaction';
import { convertBetweenCurrencies } from '@/utils/currency';
import SpendingCategoriesChart from '@/components/charts/SpendingCategoriesChart';
import SpendingByVendorChart from '@/components/charts/SpendingByVendorChart';
import RecentTransactions from '@/components/RecentTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const IndexPage: React.FC = () => {
  const { transactions, accounts, accountCurrencyMap } = useTransactions();
  const { selectedCurrency, formatCurrency } = useCurrency();

  // Placeholder filter states (assuming they come from a hook or local state)
  const selectedAccounts: string[] = [];
  const selectedCategories: string[] = [];
  const dateRange = { from: new Date(2023, 0, 1), to: new Date() };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    });

    if (selectedAccounts.length > 0) {
      filtered = filtered.filter(t => selectedAccounts.includes(t.account));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.category));
    }

    return filtered;
  }, [transactions, dateRange, selectedAccounts, selectedCategories]);

  const calculateMonthlySummary = (currentTransactions: Transaction[]) => {
    const summary: Record<string, { income: number; expenses: number; net: number }> = {};

    currentTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!summary[month]) {
        summary[month] = { income: 0, expenses: 0, net: 0 };
      }

      const convertedAmount = convertBetweenCurrencies(transaction.amount, transaction.currency, selectedCurrency);

      if (transaction.amount > 0 && transaction.category !== 'Transfer') {
        summary[month].income += convertedAmount;
      } else if (transaction.amount < 0 && transaction.category !== 'Transfer') {
        summary[month].expenses += Math.abs(convertedAmount);
      }
    });

    Object.values(summary).forEach(s => {
      s.net = s.income - s.expenses;
    });

    return summary;
  };

  const calculateNetBalance = (currentTransactions: Transaction[]) => {
    return currentTransactions.reduce((acc, t) => {
      if (t.category !== 'Transfer') {
        return acc + convertBetweenCurrencies(t.amount, t.currency, selectedCurrency);
      }
      return acc;
    }, 0);
  };

  const calculateTotalIncome = (currentTransactions: Transaction[]) => {
    return currentTransactions.reduce((acc, t) => {
      if (t.amount > 0 && t.category !== 'Transfer') {
        return acc + convertBetweenCurrencies(t.amount, t.currency, selectedCurrency);
      }
      return acc;
    }, 0);
  };

  const calculateTotalExpenses = (currentTransactions: Transaction[]) => {
    return currentTransactions.reduce((acc, t) => {
      if (t.amount < 0 && t.category !== 'Transfer') {
        return acc + Math.abs(convertBetweenCurrencies(t.amount, t.currency, selectedCurrency));
      }
      return acc;
    }, 0);
  };

  const calculateRunningBalance = (currentTransactions: Transaction[]) => {
    const sortedTransactions = [...currentTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBalance = accounts.reduce((sum, acc) => sum + (acc.starting_balance || 0), 0);

    sortedTransactions.forEach(transaction => {
      if (transaction.category !== 'Transfer') {
        runningBalance += convertBetweenCurrencies(transaction.amount, transaction.currency, selectedCurrency);
      }
    });
    return runningBalance;
  };

  const netBalance = calculateNetBalance(filteredTransactions);
  const totalIncome = calculateTotalIncome(filteredTransactions);
  const totalExpenses = calculateTotalExpenses(filteredTransactions);
  const runningBalance = calculateRunningBalance(transactions); // Use all transactions for running balance

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(runningBalance, selectedCurrency)}</div>
            <p className="text-xs text-muted-foreground">Total across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income (Period)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome, selectedCurrency)}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses (Period)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses, selectedCurrency)}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Flow (Period)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(netBalance, selectedCurrency)}</div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SpendingCategoriesChart transactions={filteredTransactions} />
        </div>
        <div className="lg:col-span-1">
          <SpendingByVendorChart transactions={filteredTransactions} />
        </div>
        <div className="lg:col-span-1">
          {/* Placeholder for Budget Health Widget */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Budget Health</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Budget health widget placeholder.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <RecentTransactions transactions={filteredTransactions} selectedCategories={selectedCategories} />
    </div>
  );
};

export default IndexPage;