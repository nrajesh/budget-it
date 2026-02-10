"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Loader2 } from "lucide-react";
import { Budget } from "@/data/finance-data";
import { useLedger } from "@/contexts/LedgerContext";
import { useQuery } from "@tanstack/react-query";
import { useDataProvider } from "@/context/DataProviderContext";

export const BudgetVsConsumptionChart = () => {
  const { activeLedger } = useLedger();
  const { transactions } = useTransactions();
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();
  const dataProvider = useDataProvider();

  const { data: budgets = [], isLoading } = useQuery<Budget[], Error>({
    queryKey: ["budgets", activeLedger?.id],
    queryFn: async () => {
      if (!activeLedger?.id) return [];
      const budgets = await dataProvider.getBudgetsWithSpending(
        activeLedger.id,
      );
      return budgets;
    },
    enabled: !!activeLedger,
  });

  const metrics = React.useMemo(() => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const activeMonthlyBudgets = budgets.filter((b) => {
      const startDate = new Date(b.start_date);
      const endDate = b.end_date ? new Date(b.end_date) : null;
      // Relaxed filter: show all active budgets that are current
      return startDate <= now && (!endDate || endDate >= now);
    });

    let totalBudget = 0;
    let totalSpent = 0;

    activeMonthlyBudgets.forEach((b) => {
      totalBudget += convertBetweenCurrencies(
        b.target_amount,
        b.currency || selectedCurrency,
        selectedCurrency,
      );

      const spentForBudget = transactions
        .filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            t.category === b.category_name &&
            transactionDate >= periodStart &&
            transactionDate <= periodEnd &&
            t.amount < 0
          );
        })
        .reduce(
          (sum, t) =>
            sum +
            convertBetweenCurrencies(
              Math.abs(t.amount),
              t.currency || selectedCurrency,
              selectedCurrency,
            ),
          0,
        );

      totalSpent += spentForBudget;
    });

    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return { totalBudget, totalSpent, percentage };
  }, [budgets, transactions, selectedCurrency, convertBetweenCurrencies]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Safety check if no budgets
  if (metrics.totalBudget === 0 && metrics.totalSpent === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No active budgets setup.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isOverBudget = metrics.totalSpent > metrics.totalBudget;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(metrics.totalBudget)}
              </p>
              <p className="text-xs text-muted-foreground">Budgeted</p>
            </div>
            <div className="text-right">
              <p
                className={`text-2xl font-bold ${isOverBudget ? "text-red-500" : "text-foreground"}`}
              >
                {formatCurrency(metrics.totalSpent)}
              </p>
              <p className="text-xs text-muted-foreground">
                Spent{" "}
                {metrics.percentage > 0 &&
                  `(${metrics.percentage.toFixed(0)}%)`}
              </p>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full ${isOverBudget ? "bg-red-500" : "bg-primary"}`}
              style={{ width: `${Math.min(metrics.percentage, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
