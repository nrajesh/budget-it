import { Budget } from "../../types/budgets";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const percentage = budget.target_amount > 0 ? Math.min(100, (budget.spent_amount / budget.target_amount) * 100) : 0;
  const isOverBudget = percentage > 100;
  const remaining = budget.target_amount - budget.spent_amount;

  const startDate = format(new Date(budget.start_date), "MMM dd, yyyy");
  const endDate = budget.end_date ? format(new Date(budget.end_date), "MMM dd, yyyy") : 'Ongoing';

  return (
    <Card className={isOverBudget ? "border-red-500 shadow-lg" : ""}>
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          {budget.category_name}
          <span className="text-sm font-normal text-muted-foreground">{budget.frequency}</span>
        </CardTitle>
        <CardDescription>
          {startDate} - {endDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm font-medium">
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