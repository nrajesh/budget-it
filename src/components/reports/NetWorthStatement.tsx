import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface NetWorthStatementProps {
  transactions: any[];
  accounts: any[];
}

const NetWorthStatement: React.FC<NetWorthStatementProps> = ({ transactions, accounts }) => {
  const { formatCurrency, convertAmount, selectedCurrency } = useCurrency();

  const { assets, liabilities, netWorth } = React.useMemo(() => {
    // ... calculation logic
    return { assets: 0, liabilities: 0, netWorth: 0 };
  }, [transactions, accounts]);

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
              <div className="text-2xl font-bold text-green-500">{formatCurrency(convertAmount(assets), selectedCurrency)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{formatCurrency(convertAmount(liabilities), selectedCurrency)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(convertAmount(netWorth), selectedCurrency)}</div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetWorthStatement;