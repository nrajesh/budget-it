import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Wallet, Store, Layers, Tag } from "lucide-react";
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

export const BudgetsTable: React.FC<BudgetsTableProps> = ({
  budgets,
  onEdit,
  onDelete,
}) => {
  const { formatCurrency, convertBetweenCurrencies } = useCurrency();
  const { transactions, categories, subCategories } = useTransactions();

  const budgetProgress = React.useMemo(() => {
    const progressMap = new Map<
      string,
      { actual: number; percentage: number }
    >();
    budgets.forEach((budget) => {
      const now = new Date();
      const startDate = new Date(budget.start_date);
      if (
        !budget.is_active ||
        now < startDate ||
        (budget.end_date && now > new Date(budget.end_date))
      ) {
        progressMap.set(budget.id, { actual: 0, percentage: 0 });
        return;
      }

      // Simplified period calculation for display (assumes monthly for now)
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const scope = budget.budget_scope || "category";
      const scopeName = (budget.budget_scope_name || "").trim().toLowerCase();

      const category = categories.find((c) => c.id === budget.category_id);
      const categoryName = category?.name || budget.category_name;

      const subCategory = budget.sub_category_id
        ? subCategories.find((s) => s.id === budget.sub_category_id)
        : null;
      const subCategoryName = subCategory?.name || budget.sub_category_name;

      const actualSpending = transactions
        .filter((t) => {
          const isDateMatch =
            new Date(t.date) >= periodStart && new Date(t.date) <= periodEnd;
          const isAmountMatch = t.amount < 0;

          if (!isDateMatch || !isAmountMatch) return false;

          // Scope-based matching
          if (scope === "account") {
            return (t.account || "").trim().toLowerCase() === scopeName;
          } else if (scope === "vendor") {
            return (t.vendor || "").trim().toLowerCase() === scopeName;
          } else {
            const isCategoryMatch = t.category === categoryName;
            if (!isCategoryMatch) return false;

            // If budget has a sub-category, transaction MUST match it
            if (budget.sub_category_id) {
              if (!subCategoryName) return false;
              return t.sub_category === subCategoryName;
            }
            return true;
          }
        })
        .reduce((sum, t) => {
          const convertedAmount = convertBetweenCurrencies(
            Math.abs(t.amount),
            t.currency,
            budget.currency,
          );
          return sum + convertedAmount;
        }, 0);

      const percentage = (actualSpending / budget.target_amount) * 100;
      progressMap.set(budget.id, { actual: actualSpending, percentage });
    });
    return progressMap;
  }, [
    budgets,
    transactions,
    convertBetweenCurrencies,
    categories,
    subCategories,
  ]);

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tracking</TableHead>
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
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-4 text-muted-foreground"
              >
                No budgets found.
              </TableCell>
            </TableRow>
          ) : (
            budgets.map((budget) => {
              const progress = budgetProgress.get(budget.id) || {
                actual: 0,
                percentage: 0,
              };
              const progressColor =
                progress.percentage > 100 ? "bg-destructive" : "bg-primary";

              const subCategoryName = budget.sub_category_id
                ? subCategories.find((s) => s.id === budget.sub_category_id)
                    ?.name
                : budget.sub_category_name;

              return (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">
                    {(() => {
                      if (budget.budget_scope === "account") {
                        return (
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-100">
                              {budget.budget_scope_name}
                            </span>
                            <span className="text-xs text-slate-500">
                              (Account)
                            </span>
                          </div>
                        );
                      }
                      if (budget.budget_scope === "vendor") {
                        return (
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-100">
                              {budget.budget_scope_name}
                            </span>
                            <span className="text-xs text-slate-500">
                              (Vendor)
                            </span>
                          </div>
                        );
                      }
                      if (budget.budget_scope === "sub_category") {
                        return (
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-100">
                              {budget.budget_scope_name}
                            </span>
                            <span className="text-xs text-slate-500">
                              (Sub-cat)
                            </span>
                          </div>
                        );
                      }
                      // Default case for category or if scope is not defined/recognized
                      return (
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-100">
                            {budget.category_name}
                          </span>
                          {subCategoryName && (
                            <span className="text-xs text-slate-500">
                              ({subCategoryName})
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(budget.target_amount, budget.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>
                        {formatCurrency(progress.actual, budget.currency)} (
                        {Math.round(progress.percentage)}%)
                      </span>
                      <Progress
                        value={Math.min(progress.percentage, 100)}
                        className="h-2"
                        indicatorClassName={progressColor}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{budget.frequency}</TableCell>
                  <TableCell>
                    {formatDateToDDMMYYYY(budget.start_date)} -{" "}
                    {budget.end_date
                      ? formatDateToDDMMYYYY(budget.end_date)
                      : "Ongoing"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={budget.is_active ? "default" : "outline"}>
                      {budget.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(budget)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(budget)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
