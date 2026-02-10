import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrency } from "@/contexts/CurrencyContext";

interface IncomeExpenseSummaryProps {
  transactions: any[];
}

const IncomeExpenseSummary: React.FC<IncomeExpenseSummaryProps> = ({
  transactions,
}) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();

  const summary = React.useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((t) => {
      if (t.category !== "Transfer") {
        const convertedAmount = convertBetweenCurrencies(
          t.amount,
          t.currency,
          selectedCurrency,
        );
        if (convertedAmount > 0) {
          totalIncome += convertedAmount;
          incomeByCategory[t.category] =
            (incomeByCategory[t.category] || 0) + convertedAmount;
        } else {
          totalExpenses += Math.abs(convertedAmount);
          expensesByCategory[t.category] =
            (expensesByCategory[t.category] || 0) + Math.abs(convertedAmount);
        }
      }
    });

    return { incomeByCategory, expensesByCategory, totalIncome, totalExpenses };
  }, [transactions, selectedCurrency, convertBetweenCurrencies]);

  return (
    <Card className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle>Income and Expense Summary</CardTitle>
        <CardDescription>
          A breakdown of your income and expenses by category.
        </CardDescription>
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
              {Object.entries(summary.incomeByCategory).map(
                ([category, amount]) => (
                  <TableRow key={category}>
                    <TableCell>{category}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(amount)}
                    </TableCell>
                  </TableRow>
                ),
              )}
              <TableRow className="font-bold">
                <TableCell>Total Income</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(summary.totalIncome)}
                </TableCell>
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
              {Object.entries(summary.expensesByCategory).map(
                ([category, amount]) => (
                  <TableRow key={category}>
                    <TableCell>{category}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(amount)}
                    </TableCell>
                  </TableRow>
                ),
              )}
              <TableRow className="font-bold">
                <TableCell>Total Expenses</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(summary.totalExpenses)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseSummary;
