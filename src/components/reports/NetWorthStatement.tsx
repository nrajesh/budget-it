import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Import Table components
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface NetWorthStatementProps {
  transactions: any[];
  accounts: any[];
}

const NetWorthStatement: React.FC<NetWorthStatementProps> = ({ transactions, accounts }) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();

  const { assets, liabilities, netWorth } = React.useMemo(() => {
    const accountBalances: Record<string, number> = {};

    // Initialize balances by converting each account's starting balance to the selected currency
    accounts.forEach(account => {
      const startingBalance = account.starting_balance || 0;
      const accountCurrency = account.currency || 'USD'; // Assume USD if currency is not specified
      accountBalances[account.name] = convertBetweenCurrencies(startingBalance, accountCurrency, selectedCurrency);
    });

    // Adjust balances with each transaction, converting transaction amounts
    transactions.forEach(transaction => {
      if (transaction.category !== 'Transfer') {
        const convertedAmount = convertBetweenCurrencies(transaction.amount, transaction.currency, selectedCurrency);
        accountBalances[transaction.account] = (accountBalances[transaction.account] || 0) + convertedAmount;
      }
    });

    let totalAssets = 0;
    let totalLiabilities = 0;

    // Sum up the final balances
    Object.values(accountBalances).forEach(balance => {
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
  }, [transactions, accounts, selectedCurrency, convertBetweenCurrencies]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Statement</CardTitle>
        <CardDescription>A summary of your assets and liabilities.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3 mb-6">
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

        {/* Table for PDF export */}
        <Table className="w-full mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Total Assets</TableCell>
              <TableCell className="text-right text-green-500">{formatCurrency(assets)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Total Liabilities</TableCell>
              <TableCell className="text-right text-red-500">{formatCurrency(liabilities)}</TableCell>
            </TableRow>
            <TableRow className="font-bold">
              <TableCell>Net Worth</TableCell>
              <TableCell className="text-right">{formatCurrency(netWorth)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default NetWorthStatement;