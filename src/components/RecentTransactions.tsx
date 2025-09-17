import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RecentTransactionsProps {
  currentTransactions: any[];
  accountCurrencyMap: Record<string, string>;
  formatCurrency: (amount: number, currency: string) => string;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ currentTransactions, accountCurrencyMap, formatCurrency }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {currentTransactions.map((transaction) => {
          const currentAccountCurrency = accountCurrencyMap[transaction.account] || transaction.currency;
          return (
            <TableRow key={transaction.id}>
              <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
              <TableCell>{transaction.account}</TableCell>
              <TableCell>{transaction.vendor}</TableCell>
              <TableCell><Badge variant="outline">{transaction.category}</Badge></TableCell>
              <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(transaction.amount, currentAccountCurrency)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default RecentTransactions;