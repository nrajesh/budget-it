import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { formatDateToDDMMYYYY } from "@/lib/utils";
import { Budget } from "@/data/finance-data";

interface BudgetsTableProps {
  budgets: Budget[];
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export const BudgetsTable: React.FC<BudgetsTableProps> = ({ budgets, onEdit, onDelete }) => {
  const { formatCurrency, convertBetweenCurrencies } = useCurrency();
  const { transactions } = useTransactions();

  const budgetProgress = React.useMemo(() => {
    const progressMap = new Map<string, { actual: number; percentage: number }>();
    budgets.forEach(budget => {
      const now = new Date();
      const startDate = new Date(budget.start_date);
      if (!budget.is_active || now < startDate || (budget.end_date && now > new Date(budget.end_date))) {
        progressMap.set(budget.id, { actual: 0, percentage: 0 });
        return;
      }

      // Simplified period calculation for display (assumes monthly for now)
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const actualSpending = transactions
        .filter(t =>
          t.category === budget.category_name &&
          new Date(t.date) >= periodStart &&
          new Date(t.date) <= periodEnd &&
          t.amount < 0
        )
        .reduce((sum, t) => {
          const convertedAmount = convertBetweenCurrencies(Math.abs(t.amount), t.currency, budget.currency);
          return sum + convertedAmount;
        }, 0);

      const percentage = (actualSpending / budget.target_amount) * 100;
      progressMap.set(budget.id, { actual: actualSpending, percentage });
    });
    return progressMap;
  }, [budgets, transactions, convertBetweenCurrencies]);

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center py-4 text-muted-foreground">No budgets found.</TableCell></TableRow>
          ) : (
            budgets.map((budget) => {
              const progress = budgetProgress.get(budget.id) || { actual: 0, percentage: 0 };
              const progressColor = progress.percentage > 100 ? "bg-destructive" : "bg-primary";
              return (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">{budget.category_name}</TableCell>
                  <TableCell>{formatCurrency(budget.target_amount, budget.currency)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>{formatCurrency(progress.actual, budget.currency)} ({Math.round(progress.percentage)}%)</span>
                      <Progress value={progress.percentage} className="h-2" indicatorClassName={progressColor} />
                    </div>
                  </TableCell>
                  <TableCell>{budget.frequency}</TableCell>
                  <TableCell>{formatDateToDDMMYYYY(budget.start_date)} - {budget.end_date ? formatDateToDDMMYYYY(budget.end_date) : 'Ongoing'}</TableCell>
                  <TableCell><Badge variant={budget.is_active ? "default" : "outline"}>{budget.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(budget)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(budget)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};