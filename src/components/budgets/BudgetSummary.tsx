import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Budget } from "@/types/budgets";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface BudgetSummaryProps {
  budgets: Budget[];
  isLoading: boolean;
}

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

export function BudgetSummary({ budgets, isLoading }: BudgetSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.target_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const currency = budgets[0]?.currency || "USD";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalBudgeted, currency)}
          </div>
          <p className="text-xs text-muted-foreground">Across {budgets.length} budgets</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalSpent, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalBudgeted > 0 ? `${((totalSpent / totalBudgeted) * 100).toFixed(0)}%` : '0%'} of total budget
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalRemaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
            {formatCurrency(totalRemaining, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalRemaining < 0 ? 'Overspent' : 'Left to spend'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}