import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
import BalanceOverTimeChart from '@/components/BalanceOverTimeChart';
import SpendingCategoriesChart from '@/components/SpendingCategoriesChart';
import RecentTransactions from '@/components/RecentTransactions';
import LoadingSpinner from '@/components/LoadingSpinner';

const Index = () => {
  const { transactions, accounts, isLoading, accountCurrencyMap } = useTransactions();
  const { formatCurrency, selectedCurrency, convertAmount } = useCurrency();

  const {
    totalBalance,
    totalIncome,
    totalExpenses,
    incomeChange,
    expensesChange,
    recentTransactions,
  } = React.useMemo(() => {
    if (!accounts.length || !transactions.length) {
      return {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        incomeChange: { value: 0, isPositive: false },
        expensesChange: { value: 0, isPositive: false },
        recentTransactions: [],
      };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Calculate total balance
    const bal = accounts.reduce((sum, acc) => {
      const balanceInSelectedCurrency = convertAmount(acc.running_balance || 0, acc.currency, selectedCurrency);
      return sum + balanceInSelectedCurrency;
    }, 0);

    // Filter transactions for the last 60 days
    const transactionsLast60Days = transactions.filter(t => new Date(t.date) >= sixtyDaysAgo);

    let incomeLast30Days = 0;
    let expensesLast30Days = 0;
    let income30to60DaysAgo = 0;
    let expenses30to60DaysAgo = 0;

    transactionsLast60Days.forEach(t => {
      if (t.category === 'Transfer') return;

      const transactionDate = new Date(t.date);
      const amountInSelectedCurrency = convertAmount(t.amount, t.currency, selectedCurrency);

      if (transactionDate >= thirtyDaysAgo) {
        // Last 30 days
        if (amountInSelectedCurrency > 0) {
          incomeLast30Days += amountInSelectedCurrency;
        } else {
          expensesLast30Days += Math.abs(amountInSelectedCurrency);
        }
      } else {
        // 30 to 60 days ago
        if (amountInSelectedCurrency > 0) {
          income30to60DaysAgo += amountInSelectedCurrency;
        } else {
          expenses30to60DaysAgo += Math.abs(amountInSelectedCurrency);
        }
      }
    });

    const calculateChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? { value: 100, isPositive: true } : { value: 0, isPositive: false };
      }
      const change = ((current - previous) / previous) * 100;
      return { value: Math.abs(change), isPositive: change >= 0 };
    };

    const recents = transactions.slice(0, 5);

    return {
      totalBalance: bal,
      totalIncome: incomeLast30Days,
      totalExpenses: expensesLast30Days,
      incomeChange: calculateChange(incomeLast30Days, income30to60DaysAgo),
      expensesChange: calculateChange(expensesLast30Days, expenses30to60DaysAgo),
      recentTransactions: recents,
    };
  }, [transactions, accounts, convertAmount, selectedCurrency]);

  const getChangeColorClass = (isPositive: boolean, type: 'income' | 'expenses') => {
    if (type === 'expenses') {
      return isPositive ? 'text-red-500' : 'text-green-500'; // Higher expenses are bad
    }
    return isPositive ? 'text-green-500' : 'text-red-500'; // Higher income is good
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance, selectedCurrency)}</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income (Last 30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome, selectedCurrency)}</div>
            <p className={cn("text-xs flex items-center", getChangeColorClass(incomeChange.isPositive, 'income'))}>
              {incomeChange.isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {incomeChange.value.toFixed(2)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses (Last 30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses, selectedCurrency)}</div>
            <p className={cn("text-xs flex items-center", getChangeColorClass(expensesChange.isPositive, 'expenses'))}>
              {expensesChange.isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {expensesChange.value.toFixed(2)}% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <BalanceOverTimeChart transactions={transactions} accounts={accounts} />
        </div>
        <div className="lg:col-span-3">
          <SpendingCategoriesChart transactions={transactions} />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTransactions
            currentTransactions={recentTransactions}
            accountCurrencyMap={accountCurrencyMap}
            formatCurrency={formatCurrency}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;