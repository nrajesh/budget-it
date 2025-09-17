import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface NetWorthStatementProps {
  transactions: any[];
  accounts: any[];
}

const NetWorthStatement: React.FC<NetWorthStatementProps> = ({ transactions, accounts }) => {
  const { formatCurrency } = useCurrency();

  const { assets, liabilities, netWorth } = React.useMemo(() => {
    const accountBalances: Record<string, number> = {};

    accounts.forEach(account => {
      accountBalances[account.name] = account.starting_balance || 0;
    });

    transactions.forEach(transaction => {
      if (transaction.category !== 'Transfer') {
        accountBalances[transaction.account] = (accountBalances[transaction.account] || 0) + transaction.amount;
      }
    });

    let totalAssets = 0;
    let totalLiabilities = 0;

    accounts.forEach(account => {
      const balance = accountBalances[account.name] || 0;
      if (balance >= 0) {
        totalAssets += balance;
      } else {
        totalLiabilities += Math.abs(balance);
      }
    });

    return {
      assets: totalAssets,
      liabilities: totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    };
  }, [transactions, accounts]);

  const assetAccounts = accounts.filter(acc => (acc.starting_balance || 0) >= 0);
  const liabilityAccounts = accounts.filter(acc => (acc.starting_balance || 0) < 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Statement</CardTitle>
        <CardDescription>A summary of your assets and liabilities.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(assets)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{formatCurrency(liabilities)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(netWorth)}</div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetWorthStatement;