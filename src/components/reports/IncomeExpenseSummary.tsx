import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrency } from "@/contexts/CurrencyContext";

interface IncomeExpenseSummaryProps {
  transactions: any[];
}

const IncomeExpenseSummary: React.FC<IncomeExpenseSummaryProps> = ({ transactions }) => {
  const { formatCurrency, convertAmount, selectedCurrency } = useCurrency();

  const summary = React.useMemo(() => {
    // ... calculation logic
    return { incomeByCategory: {}, expensesByCategory: {}, totalIncome: 0, totalExpenses: 0 };
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income and Expense Summary</CardTitle>
        <CardDescription>A breakdown of your income and expenses by category.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold mb-2">Income</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(summary.incomeByCategory).map(([category, amount]: [string, number]) => (
                <TableRow key={category}>
                  <TableCell>{category}</TableCell>
                  <TableCell className="text-right">{formatCurrency(convertAmount(amount), selectedCurrency)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>Total Income</TableCell>
                <TableCell className="text-right">{formatCurrency(convertAmount(summary.totalIncome), selectedCurrency)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Expenses</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(summary.expensesByCategory).map(([category, amount]: [string, number]) => (
                <TableRow key={category}>
                  <TableCell>{category}</TableCell>
                  <TableCell className="text-right">{formatCurrency(convertAmount(amount), selectedCurrency)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>Total Expenses</TableCell>
                <TableCell className="text-right">{formatCurrency(convertAmount(summary.totalExpenses), selectedCurrency)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseSummary;