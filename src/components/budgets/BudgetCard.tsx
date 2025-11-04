import { Budget } from "@/types/budgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
}

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const spent = budget.spent_amount;
  const target = budget.target_amount;
  const remaining = target - spent;
  const progress = target > 0 ? (spent / target) * 100 : 0;

  const getProgressColor = () => {
    if (progress >= 100) return "bg-red-500";
    if (progress >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">{budget.category_name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(budget)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(budget.id)} className="text-red-500">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-2xl font-bold">{formatCurrency(spent, budget.currency)}</span>
            <span className="text-sm text-muted-foreground">
              / {formatCurrency(target, budget.currency)}
            </span>
          </div>
          <Progress value={progress} indicatorClassName={getProgressColor()} />
        </div>
        <div className={`text-sm font-medium ${remaining < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
          {remaining >= 0
            ? `${formatCurrency(remaining, budget.currency)} remaining`
            : `${formatCurrency(Math.abs(remaining), budget.currency)} overspent`}
        </div>
        <p className="text-xs text-muted-foreground capitalize">{budget.frequency} budget</p>
      </CardContent>
    </Card>
  );
}