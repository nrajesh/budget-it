import { Budget } from "../../types/budgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface BudgetSummaryProps {
  budgets: Budget[];
  isLoading: boolean;
}

export function BudgetSummary({ budgets, isLoading }: BudgetSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  if (budgets.length === 0) {
    return null;
  }

  const totalTarget = budgets.reduce((sum, b) => sum + b.target_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0);
  const currency = budgets[0]?.currency || 'USD';

  const remaining = totalTarget - totalSpent;
  const remainingColor = remaining >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalTarget, currency)}</div>
          <p className="text-xs text-muted-foreground">Across {budgets.length} active budgets</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalSpent, currency)}</div>
          <p className="text-xs text-muted-foreground">Since start dates</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${remainingColor}`}>
            {formatCurrency(remaining, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            {remaining >= 0 ? "Under budget" : "Over budget"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}