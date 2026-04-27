"use client";

import { useMemo, useState } from "react";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { type EntityType } from "./SpendingPieChart";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

interface EntityBreakdownTableProps {
  transactions: Transaction[];
  entityType: EntityType;
  onEntityTypeChange: (type: EntityType) => void;
  selectedEntity: string | null;
  onEntitySelect: (entityName: string | null) => void;
}

const ENTITY_LABEL_KEYS: Record<EntityType, string> = {
  category: "analytics.breakdown.byCategory",
  vendor: "analytics.breakdown.byMerchant",
  currency: "analytics.breakdown.byCurrency",
  account: "analytics.breakdown.byAccount",
};

const ENTITY_ICONS: Record<EntityType, string> = {
  category: "≡",
  vendor: "🏪",
  currency: "💱",
  account: "💳",
};

interface BreakdownItem {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

function computeBreakdown(
  transactions: Transaction[],
  entityType: EntityType,
  selectedEntity: string | null,
  labels: { unknown: string; uncategorized: string },
): BreakdownItem[] {
  let spendingTxs = transactions.filter(
    (t) => t.amount < 0 && t.category !== "Transfer",
  );

  // If an entity is selected (from pie chart), filter to it and show sub-breakdown
  if (selectedEntity && entityType === "category") {
    // Show sub-categories within the selected category
    spendingTxs = spendingTxs.filter((t) => t.category === selectedEntity);

    const map = new Map<string, { amount: number; count: number }>();
    spendingTxs.forEach((t) => {
      const key = t.sub_category || labels.uncategorized;
      const existing = map.get(key) || { amount: 0, count: 0 };
      existing.amount += Math.abs(t.amount);
      existing.count += 1;
      map.set(key, existing);
    });

    const total = Array.from(map.values()).reduce(
      (sum, v) => sum + v.amount,
      0,
    );

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // Standard entity breakdown
  const map = new Map<string, { amount: number; count: number }>();

  spendingTxs.forEach((t) => {
    let key: string;
    switch (entityType) {
      case "category":
        key = t.category || labels.uncategorized;
        break;
      case "vendor":
        key = t.vendor || labels.unknown;
        break;
      case "currency":
        key = t.currency || labels.unknown;
        break;
      case "account":
        key = t.account || labels.unknown;
        break;
      default:
        key = labels.unknown;
    }

    const existing = map.get(key) || { amount: 0, count: 0 };
    existing.amount += Math.abs(t.amount);
    existing.count += 1;
    map.set(key, existing);
  });

  const total = Array.from(map.values()).reduce((sum, v) => sum + v.amount, 0);

  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/** Get transactions for a specific sub-category within a selected category */
function getSubCategoryTransactions(
  transactions: Transaction[],
  category: string,
  subCategory: string,
  labels: { uncategorized: string },
): Transaction[] {
  return transactions
    .filter(
      (t) =>
        t.amount < 0 &&
        t.category !== "Transfer" &&
        t.category === category &&
        (t.sub_category || labels.uncategorized) === subCategory,
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function EntityBreakdownTable({
  transactions,
  entityType,
  onEntityTypeChange,
  selectedEntity,
  onEntitySelect,
}: EntityBreakdownTableProps) {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();
  // Track the selected sub-category for transaction drill-down
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  );

  const fallbackLabels = useMemo(
    () => ({
      unknown: t("analytics.breakdown.unknown", { defaultValue: "Unknown" }),
      uncategorized: t("analytics.breakdown.uncategorized", {
        defaultValue: "Uncategorized",
      }),
    }),
    [t],
  );

  const breakdown = useMemo(
    () =>
      computeBreakdown(
        transactions,
        entityType,
        selectedEntity,
        fallbackLabels,
      ),
    [transactions, entityType, selectedEntity, fallbackLabels],
  );

  // Get transactions when a sub-category is selected
  const subCategoryTransactions = useMemo(() => {
    if (!selectedEntity || !selectedSubCategory) return [];
    return getSubCategoryTransactions(
      transactions,
      selectedEntity,
      selectedSubCategory,
      { uncategorized: fallbackLabels.uncategorized },
    );
  }, [
    transactions,
    selectedEntity,
    selectedSubCategory,
    fallbackLabels.uncategorized,
  ]);

  // Determine the current view depth
  const isSubCategoryView =
    selectedEntity !== null && entityType === "category";
  const isTransactionView = isSubCategoryView && selectedSubCategory !== null;

  // Build title and breadcrumb
  const title = isTransactionView
    ? selectedSubCategory
    : selectedEntity
      ? selectedEntity
      : t(ENTITY_LABEL_KEYS[entityType], {
          defaultValue: `By ${entityType}`,
        });

  // Handle back navigation
  const handleBack = () => {
    if (isTransactionView) {
      // Go back from transactions → sub-categories
      setSelectedSubCategory(null);
    } else if (isSubCategoryView) {
      // Go back from sub-categories → categories (reset pie selection)
      setSelectedSubCategory(null);
      onEntitySelect(null);
    }
  };

  // Handle clicking a row
  const handleRowClick = (itemName: string) => {
    if (isSubCategoryView && !isTransactionView) {
      // At sub-category level: drill into transactions
      setSelectedSubCategory(itemName);
    } else if (!isSubCategoryView) {
      // At top level: select entity (syncs with pie)
      onEntitySelect(itemName);
    }
  };

  // Reset sub-category when entity selection changes externally
  // (e.g. pie chart reset)
  if (!selectedEntity && selectedSubCategory) {
    setSelectedSubCategory(null);
  }

  const showBackButton = isSubCategoryView || isTransactionView;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label={t("analytics.breakdown.goBack", {
                defaultValue: "Go back",
              })}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {showBackButton ? (
            <span className="text-base font-semibold text-foreground">
              {title}
            </span>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 text-base font-semibold text-foreground hover:text-primary transition-colors">
                {title}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {(Object.keys(ENTITY_LABEL_KEYS) as EntityType[]).map(
                  (type) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => onEntityTypeChange(type)}
                      className={
                        entityType === type ? "bg-accent font-medium" : ""
                      }
                    >
                      <span className="mr-2">{ENTITY_ICONS[type]}</span>
                      {t(ENTITY_LABEL_KEYS[type], {
                        defaultValue: type,
                      })}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Reset/Clear button when filtered */}
        {showBackButton && (
          <button
            onClick={() => {
              setSelectedSubCategory(null);
              onEntitySelect(null);
            }}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/15"
          >
            {t("analytics.breakdown.clear", { defaultValue: "Clear" })}
          </button>
        )}
      </div>

      {/* Breadcrumb for sub-category/transaction views */}
      {isSubCategoryView && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground px-3 mb-2">
          <button
            onClick={() => {
              setSelectedSubCategory(null);
              onEntitySelect(null);
            }}
            className="hover:text-foreground transition-colors"
          >
            {t("analytics.breakdown.all", { defaultValue: "All" })}
          </button>
          <span>›</span>
          <button
            onClick={() => setSelectedSubCategory(null)}
            className={`hover:text-foreground transition-colors ${
              !isTransactionView ? "text-foreground font-medium" : ""
            }`}
          >
            {selectedEntity}
          </button>
          {isTransactionView && (
            <>
              <span>›</span>
              <span className="text-foreground font-medium">
                {selectedSubCategory}
              </span>
            </>
          )}
        </div>
      )}

      {/* Transaction list view */}
      {isTransactionView ? (
        subCategoryTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t("analytics.breakdown.noTransactionsFound", {
              defaultValue: "No transactions found",
            })}
          </p>
        ) : (
          <div className="space-y-0.5">
            {subCategoryTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-col min-w-0 flex-1 mr-4">
                  <span className="text-sm font-medium text-foreground truncate">
                    {tx.vendor || fallbackLabels.unknown}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(tx.date), "MMM d, yyyy")}
                    {tx.remarks ? ` · ${tx.remarks}` : ""}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground shrink-0">
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )
      ) : breakdown.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {t("analytics.breakdown.noDataForView", {
            defaultValue: "No data for this view",
          })}
        </p>
      ) : (
        <div className="space-y-1">
          {breakdown.map((item) => {
            const isClickable = true;
            return (
              <div
                key={item.name}
                onClick={() => handleRowClick(item.name)}
                className={`flex items-center justify-between py-3 px-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50`}
              >
                <div className="flex flex-col min-w-0 flex-1 mr-4">
                  <span className="text-sm font-medium text-foreground truncate">
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("analytics.breakdown.transactionCount", {
                      count: item.count,
                      defaultValue: "{{count}} transactions",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(-item.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                  {isClickable && (
                    <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground rotate-180" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
