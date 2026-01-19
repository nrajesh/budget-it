import { Budget } from "../../types/budgets";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, endOfDay, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "@/contexts/TransactionsContext";

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const rawPercentage = budget.target_amount > 0 ? (budget.spent_amount / budget.target_amount) * 100 : 0;
  const isOverBudget = rawPercentage > 100;
  const percentage = Math.min(100, rawPercentage);
  const remaining = budget.target_amount - budget.spent_amount;

  const startDate = format(new Date(budget.start_date), "MMM dd, yyyy");
  const endDate = budget.end_date ? format(new Date(budget.end_date), "MMM dd, yyyy") : 'Ongoing';

  const { accounts } = useTransactions();
  const navigate = useNavigate();

  const handleTitleClick = () => {
    // 1. Determine Date Range
    let startDate: Date;
    let endDate: Date;

    const now = new Date();
    const freq = budget.frequency as string;

    if (freq === 'Monthly' || freq === '1m' || !freq) {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else if (freq === 'Yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else if (freq === 'Quarterly') {
      const currentMonth = now.getMonth();
      const startMonth = currentMonth - (currentMonth % 3);
      startDate = new Date(now.getFullYear(), startMonth, 1);
      endDate = new Date(now.getFullYear(), startMonth + 3, 0);
    } else {
      startDate = parseISO(budget.start_date);
      endDate = budget.end_date ? parseISO(budget.end_date) : endOfDay(now);
    }

    // 2. Determine Account Scope
    let filterAccounts: string[] | undefined = undefined;
    if (budget.account_scope === 'GROUP' && budget.account_scope_values && budget.account_scope_values.length > 0) {
      const allowedTypes = new Set(budget.account_scope_values);
      filterAccounts = accounts
        .filter(a => a.type && allowedTypes.has(a.type))
        .map(a => a.name);
    }

    navigate('/transactions', {
      state: {
        filterCategory: budget.category_name,
        filterSubCategory: budget.sub_category_name,
        filterDateRange: { from: startDate.toISOString(), to: endDate.toISOString() },
        filterAccounts: filterAccounts
      }
    });
  };

  return (
    <Card className={isOverBudget ? "border-red-500 shadow-lg bg-red-50/30 dark:bg-red-950/20" : "bg-indigo-50/40 dark:bg-slate-900/40 border-indigo-100 dark:border-slate-800"}>
      <CardHeader>
        <CardTitle
          className="flex items-baseline gap-2 cursor-pointer hover:underline hover:text-primary transition-colors text-slate-900 dark:text-slate-50"
          onClick={handleTitleClick}
        >
          {budget.category_name}
          {budget.sub_category_name && (
            <span className="text-xl font-normal text-slate-500 dark:text-slate-400">
              {'>'} {budget.sub_category_name}
            </span>
          )}
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          {budget.frequency}
          <br />
          {startDate} - {endDate}
          <br />
          <span className="text-xs text-slate-500 dark:text-slate-500">
            Scope: {budget.account_scope === 'GROUP' ? (budget.account_scope_values?.join(", ") || "Specific Accounts") : "All Accounts"}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
          <span>Spent: {formatCurrency(budget.spent_amount, budget.currency)}</span>
          <span>Target: {formatCurrency(budget.target_amount, budget.currency)}</span>
        </div>
        <Progress value={percentage} className={isOverBudget ? "bg-red-500" : ""} />
        <div className="text-sm">
          {remaining >= 0 ? (
            <span className="text-green-600 font-medium">
              {formatCurrency(remaining, budget.currency)} remaining
            </span>
          ) : (
            <span className="text-red-600 font-medium">
              {formatCurrency(Math.abs(remaining), budget.currency)} over budget
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" size="icon" onClick={() => onEdit(budget)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="icon" onClick={() => onDelete(budget.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}