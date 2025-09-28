import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Budget } from '@/data/finance-data';
import { useNavigate } from "react-router-dom";

interface IncomeExpenseSummaryProps {
  transactions: any[];
  budgets: Budget[];
}

const IncomeExpenseSummary: React.FC<IncomeExpenseSummaryProps> = ({ transactions, budgets }) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === 'Transfer') return;
    navigate('/transactions', { state: { filterCategory: categoryName } });
  };

  const summary = React.useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      if (t.category !== 'Transfer') {
        const convertedAmount = convertBetweenCurrencies(t.amount, t.currency, selectedCurrency);
        if (convertedAmount > 0) {
          totalIncome += convertedAmount;
          incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + convertedAmount;
        } else {
          totalExpenses += Math.abs(convertedAmount);
          expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Math.abs(convertedAmount);
        }
      }
    });

    const expensesWithBudget = Object.entries(expensesByCategory).map(([category, amount]) => {
      const budget = budgets.find(b => b.category_name === category && b.is_active && b.frequency === '1m');
      const target = budget ? convertBetweenCurrencies(budget.target_amount, budget.currency, selectedCurrency) : null;
      const variance = target !== null ? target - amount : null;
      const percentSpent = target !== null && target > 0 ? (amount / target) * 100 : null;
      return { category, amount, target, variance, percentSpent };
    });

    return { incomeByCategory, expensesByCategory, totalIncome, totalExpenses, expensesWithBudget };
  }, [transactions, budgets, selectedCurrency, convertBetweenCurrencies]);

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
              {Object.entries(summary.incomeByCategory).map(([category, amount]) => (
                <TableRow key={category}>
                  <TableCell>
                    <span onClick={() => handleCategoryClick(category)} className="cursor-pointer hover:text-primary hover:underline">
                      {category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>Total Income</TableCell>
                <TableCell className="text-right">{formatCurrency(summary.totalIncome)}</TableCell>
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
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">% Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.expensesWithBudget.map(({ category, amount, target, variance, percentSpent }) => (
                <TableRow key={category}>
                  <TableCell>
                    <span onClick={() => handleCategoryClick(category)} className="cursor-pointer hover:text-primary hover:underline">
                      {category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                  <TableCell className="text-right">{target !== null ? formatCurrency(target) : '-'}</TableCell>
                  <TableCell className={`text-right ${variance !== null && variance < 0 ? 'text-red-500' : ''}`}>
                    {variance !== null ? formatCurrency(variance) : '-'}
                  </TableCell>
                  <TableCell className="text-right">{percentSpent !== null ? `${percentSpent.toFixed(0)}%` : '-'}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>Total Expenses</TableCell>
                <TableCell className="text-right">{formatCurrency(summary.totalExpenses)}</TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseSummary;