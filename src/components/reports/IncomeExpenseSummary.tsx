import React from 'react';
import { ThemedCard, ThemedCardContent, ThemedCardDescription, ThemedCardHeader, ThemedCardTitle } from "@/components/ThemedCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Budget } from '@/data/finance-data';
import { useNavigate } from "react-router-dom";

interface IncomeExpenseSummaryProps {
  transactions: any[];
  budgets: Budget[];
}


import { Calendar } from "lucide-react";

// ... imports

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
    const incomeHasScheduled: Record<string, boolean> = {}; // Track if category has scheduled tx
    const expenseHasScheduled: Record<string, boolean> = {}; // Track if category has scheduled tx

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      if (t.category !== 'Transfer') {
        const convertedAmount = convertBetweenCurrencies(t.amount, t.currency, selectedCurrency);
        if (convertedAmount > 0) {
          totalIncome += convertedAmount;
          incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + convertedAmount;
          if (t.is_scheduled_origin) incomeHasScheduled[t.category] = true;
        } else {
          totalExpenses += Math.abs(convertedAmount);
          expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Math.abs(convertedAmount);
          if (t.is_scheduled_origin) expenseHasScheduled[t.category] = true;
        }
      }
    });

    const expensesWithBudget = Object.entries(expensesByCategory).map(([category, amount]) => {
      const budget = budgets.find(b => b.category_name === category && (b.is_active ?? true) && (b.frequency === '1m' || b.frequency === 'Monthly'));
      const target = budget ? convertBetweenCurrencies(budget.target_amount, budget.currency, selectedCurrency) : null;
      const variance = target !== null ? target - amount : null;
      const percentSpent = target !== null && target > 0 ? (amount / target) * 100 : null;
      const hasScheduled = expenseHasScheduled[category];
      return { category, amount, target, variance, percentSpent, hasScheduled };
    });

    return { incomeByCategory, expensesByCategory, totalIncome, totalExpenses, expensesWithBudget, incomeHasScheduled };
  }, [transactions, budgets, selectedCurrency, convertBetweenCurrencies]);

  return (
    <ThemedCard>
      <ThemedCardHeader>
        <ThemedCardTitle>Income and Expense Summary</ThemedCardTitle>
        <ThemedCardDescription>A breakdown of your income and expenses by category.</ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent className="grid gap-6 md:grid-cols-2">
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
              {Object.entries(summary.incomeByCategory).map(([category, amount]) => {
                const hasScheduled = summary.incomeHasScheduled[category];
                return (
                  <TableRow key={category}>
                    <TableCell>
                      <span onClick={() => handleCategoryClick(category)} className="cursor-pointer hover:text-primary hover:underline flex items-center gap-2">
                        {category}
                        {hasScheduled && <Calendar className="h-3 w-3 text-muted-foreground" aria-label="Includes scheduled transactions" />}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right ${hasScheduled ? 'text-muted-foreground' : ''}`}>{formatCurrency(amount)}</TableCell>
                  </TableRow>
                )
              })}
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
              {summary.expensesWithBudget.map(({ category, amount, target, variance, percentSpent, hasScheduled }) => (
                <TableRow key={category}>
                  <TableCell>
                    <span onClick={() => handleCategoryClick(category)} className="cursor-pointer hover:text-primary hover:underline flex items-center gap-2">
                      {category}
                      {hasScheduled && <Calendar className="h-3 w-3 text-muted-foreground" aria-label="Includes scheduled transactions" />}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right ${hasScheduled ? 'text-muted-foreground' : ''}`}>{formatCurrency(amount)}</TableCell>
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
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default IncomeExpenseSummary;