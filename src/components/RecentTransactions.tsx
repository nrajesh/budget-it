import React, { useMemo } from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Transaction } from '@/types/transaction';
import { convertBetweenCurrencies } from '@/utils/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface RecentTransactionsProps {
  transactions: Transaction[];
  selectedCategories: string[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, selectedCategories }) => {
  const { accountCurrencyMap } = useTransactions();
  const { selectedCurrency, formatCurrency } = useCurrency();

  const handleVendorClick = (vendorName: string) => {
    // accountCurrencyMap is now a Map, so .has() is correct.
    const isAccount = accountCurrencyMap.has(vendorName); 
    const filterKey = isAccount ? 'filterAccount' : 'filterVendor';
    // Placeholder for setting filter state (assuming this logic exists elsewhere)
    console.log(`Setting filter: ${filterKey} = ${vendorName}`);
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [transactions]);

  const runningBalanceMap = useMemo(() => {
    const balanceMap = new Map<string, number>();
    const sortedAllTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    
    sortedAllTransactions.forEach(t => {
        if (t.category !== 'Transfer') { 
          const convertedAmount = convertBetweenCurrencies(t.amount, t.currency, selectedCurrency);
          runningBalance += convertedAmount;
        }
        balanceMap.set(t.id, runningBalance);
    });

    return balanceMap;
  }, [transactions, selectedCurrency, accountCurrencyMap]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((transaction) => {
              // accountCurrencyMap is now a Map, so .get() is correct.
              const currentAccountCurrency = accountCurrencyMap.get(transaction.account) || transaction.currency; 
              const amountColor = transaction.amount < 0 ? 'text-red-600' : 'text-green-600';
              const balance = runningBalanceMap.get(transaction.id) || 0;

              return (
                <TableRow key={transaction.id}>
                  <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{transaction.account}</TableCell>
                  <TableCell>
                    <span 
                      className="cursor-pointer hover:text-primary hover:underline"
                      onClick={() => handleVendorClick(transaction.vendor || transaction.account)}
                    >
                      {transaction.vendor || transaction.account}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${amountColor}`}>
                    {formatCurrency(transaction.amount, currentAccountCurrency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(balance, selectedCurrency)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;