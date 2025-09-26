import * as React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCurrency } from '@/contexts/CurrencyContext';

const NetWorthStatement = () => {
  const { accounts, isLoadingAccounts } = useTransactions();
  const { formatCurrency } = useCurrency();

  const netWorthData = React.useMemo(() => {
    if (!accounts) return { assets: 0, liabilities: 0, netWorth: 0 };

    // Simple assumption: positive balances are assets, negative are liabilities.
    const assets = accounts.reduce((sum, acc) => (acc.running_balance > 0 ? sum + acc.running_balance : sum), 0);
    const liabilities = accounts.reduce((sum, acc) => (acc.running_balance < 0 ? sum + Math.abs(acc.running_balance) : sum), 0);
    const netWorth = assets - liabilities;

    return { assets, liabilities, netWorth };
  }, [accounts]);

  if (isLoadingAccounts) {
    return <div>Loading net worth data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Statement</CardTitle>
        <CardDescription>
          A snapshot of your financial health, showing what you own versus what you owe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold">Total Net Worth</h3>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(netWorthData.netWorth)}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="text-md font-medium text-muted-foreground">Total Assets</h4>
            <p className="text-xl font-semibold text-green-600">
              {formatCurrency(netWorthData.assets)}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="text-md font-medium text-muted-foreground">Total Liabilities</h4>
            <p className="text-xl font-semibold text-red-600">
              {formatCurrency(netWorthData.liabilities)}
            </p>
          </div>
        </div>
        {/* This div replaces the previous <p> tag to fix the nesting error */}
        <div className="text-sm text-muted-foreground pt-4">
          This statement is a simplified calculation based on your account balances. Positive balances are treated as assets and negative balances as liabilities.
        </div>
      </CardContent>
    </Card>
  );
};

export default NetWorthStatement;