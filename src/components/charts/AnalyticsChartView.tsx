"use client";

import { useState, useCallback } from "react";
import { ThemedCard, ThemedCardContent } from "@/components/ThemedCard";
import { type Transaction } from "@/data/finance-data";
import { useAnalyticsPeriod } from "@/hooks/useAnalyticsPeriod";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { SpendingSummaryHeader } from "./SpendingSummaryHeader";
import { SpendingLineChart } from "./SpendingLineChart";
import { SpendingBarChart } from "./SpendingBarChart";
import { SpendingPieChart, type EntityType } from "./SpendingPieChart";
import { PeriodSelector } from "./PeriodSelector";
import { EntityBreakdownTable } from "./EntityBreakdownTable";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ChartMode = "line" | "bar" | "pie";

interface AnalyticsChartViewProps {
  transactions: Transaction[];
}

export function AnalyticsChartView({ transactions }: AnalyticsChartViewProps) {
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [entityType, setEntityType] = useState<EntityType>("category");
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  const analytics = useAnalyticsPeriod(transactions);

  const handleNavigateBack = useCallback(() => {
    if (analytics.canNavigateBack) {
      analytics.navigateBack();
    }
  }, [analytics]);

  const handleNavigateForward = useCallback(() => {
    if (analytics.canNavigateForward) {
      analytics.navigateForward();
    }
  }, [analytics]);

  const { containerRef } = useSwipeNavigation({
    onSwipeRight: handleNavigateBack,
    onSwipeLeft: handleNavigateForward,
    minSwipeDistance: 50,
  });

  const handleEntitySelect = useCallback((entityName: string | null) => {
    setSelectedEntity(entityName);
  }, []);

  const handleEntityTypeChange = useCallback((type: EntityType) => {
    setEntityType(type);
    setSelectedEntity(null);
  }, []);

  return (
    <div className="space-y-2">
      {/* Summary Header */}
      <SpendingSummaryHeader
        totalSpent={analytics.totalSpent}
        previousTotalSpent={analytics.previousTotalSpent}
        spentDelta={analytics.spentDelta}
        periodLabel={analytics.periodLabel}
        hasPreviousPeriod={analytics.previousRange !== null}
      />

      {/* Main Chart Card */}
      <ThemedCard className="overflow-hidden">
        <ThemedCardContent className="p-4 sm:p-6">
          {/* Chart Type Toggles + Navigation */}
          <div className="flex items-center justify-between mb-4">
            {/* Navigation chevron (desktop) */}
            <button
              onClick={handleNavigateBack}
              disabled={!analytics.canNavigateBack}
              className="p-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Chart type toggles */}
            <div className="flex items-center gap-1 bg-muted/60 rounded-full p-1">
              <button
                onClick={() => setChartMode("line")}
                className={`p-2 rounded-full transition-all duration-200 ${chartMode === "line"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                aria-label="Line chart"
                title="Line chart"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 8 12 14 8 10 2 16" />
                </svg>
              </button>
              <button
                onClick={() => setChartMode("bar")}
                className={`p-2 rounded-full transition-all duration-200 ${chartMode === "bar"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                aria-label="Bar chart"
                title="Bar chart"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="12" width="4" height="8" rx="1" />
                  <rect x="10" y="4" width="4" height="16" rx="1" />
                  <rect x="17" y="8" width="4" height="12" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => setChartMode("pie")}
                className={`p-2 rounded-full transition-all duration-200 ${chartMode === "pie"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                aria-label="Pie chart"
                title="Pie chart"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12c0-4.97-4.03-9-9-9v9h9z" />
                  <path d="M12 3a9 9 0 1 0 9 9h-9V3z" />
                </svg>
              </button>
            </div>

            {/* Navigation chevron (desktop) */}
            <button
              onClick={handleNavigateForward}
              disabled={!analytics.canNavigateForward}
              className="p-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next period"
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Swipeable Chart Area */}
          <div
            ref={containerRef}
            className="touch-pan-y"
            style={{ minHeight: "220px" }}
          >
            {chartMode === "line" && (
              <SpendingLineChart
                currentTransactions={analytics.currentPeriodTransactions}
                previousTransactions={analytics.previousPeriodTransactions}
                currentRange={analytics.currentRange}
                previousRange={analytics.previousRange}
                period={analytics.period}
              />
            )}
            {chartMode === "bar" && (
              <SpendingBarChart
                currentTransactions={analytics.currentPeriodTransactions}
                currentRange={analytics.currentRange}
                period={analytics.period}
              />
            )}
            {chartMode === "pie" && (
              <SpendingPieChart
                transactions={analytics.currentPeriodTransactions}
                currentRange={analytics.currentRange}
                entityType={entityType}
                onEntitySelect={handleEntitySelect}
                selectedEntity={selectedEntity}
              />
            )}
          </div>

          {/* Period Selector */}
          <PeriodSelector
            period={analytics.period}
            onPeriodChange={analytics.setPeriod}
            onCustomRange={analytics.setCustomRange}
          />
        </ThemedCardContent>
      </ThemedCard>

      {/* Entity Breakdown Table */}
      <ThemedCard>
        <ThemedCardContent className="p-4 sm:p-6">
          <EntityBreakdownTable
            transactions={analytics.currentPeriodTransactions}
            entityType={entityType}
            onEntityTypeChange={handleEntityTypeChange}
            selectedEntity={selectedEntity}
            onEntitySelect={handleEntitySelect}
          />
        </ThemedCardContent>
      </ThemedCard>
    </div>
  );
}
