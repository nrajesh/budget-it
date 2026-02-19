import { useMemo } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { slugify } from "@/lib/utils";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";

import { SearchFilterBar } from "@/components/filters/SearchFilterBar";
import { FinancialPulseDashboard } from "@/components/dashboard/FinancialPulseDashboard";
import { useTheme } from "@/contexts/ThemeContext";

// New Components
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { StackedCategoryChart } from "@/components/dashboard/StackedCategoryChart";
import { RunwayCard } from "@/components/dashboard/RunwayCard";
import { BudgetStatusCard } from "@/components/dashboard/BudgetStatusCard";
import { ConsolidatedMetricsCard } from "@/components/dashboard/ConsolidatedMetricsCard";

const Index = () => {
  const { transactions } = useTransactions();
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();
  const { dashboardStyle } = useTheme();

  const { selectedAccounts, selectedCategories, excludeTransfers, dateRange } =
    useTransactionFilters();

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by Date Range
    if (dateRange?.from) {
      filtered = filtered.filter((t) => new Date(t.date) >= dateRange.from!);
    }
    if (dateRange?.to) {
      filtered = filtered.filter((t) => new Date(t.date) <= dateRange.to!);
    }

    if (excludeTransfers) {
      filtered = filtered.filter((t) => t.category !== "Transfer");
    }

    if (selectedAccounts.length > 0) {
      filtered = filtered.filter((t) =>
        selectedAccounts.includes(slugify(t.account)),
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((t) =>
        selectedCategories.includes(slugify(t.category)),
      );
    }

    return filtered;
  }, [
    transactions,
    selectedAccounts,
    selectedCategories,
    excludeTransfers,
    dateRange,
  ]);

  // Calculate Metrics
  const { totalIncome, totalExpenses, totalBalance } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let balance = 0;

    filteredTransactions.forEach((t) => {
      // For balance, we sum everything (unless filtered out by logic above)
      // Note: "Total Balance" usually implies current state of accounts,
      // but here it seems to represent "Net Change" in the selected period if filters are active.
      // However, if no date filter, it's net worth.
      const amount = convertBetweenCurrencies(
        t.amount,
        t.currency || "USD",
        selectedCurrency || "USD",
      );

      // Handle Income/Expense calculation
      if (t.amount > 0) {
        if (t.category !== "Transfer" || !excludeTransfers) {
          income += amount;
        }
      } else {
        if (t.category !== "Transfer" || !excludeTransfers) {
          expenses += Math.abs(amount);
        }
      }

      // Handle Balance
      // If excludes transfers is on, balance calc might be weird if we just sum?
      // Usually transfers net to 0, so excluding them shouldn't change total balance unless inter-account.
      if (t.category !== "Transfer" || !excludeTransfers) {
        balance += amount;
      }
    });

    return {
      totalIncome: income,
      totalExpenses: expenses,
      totalBalance: balance,
    };
  }, [
    filteredTransactions,
    selectedCurrency,
    convertBetweenCurrencies,
    excludeTransfers,
  ]);

  // Calculate Percentage Changes (Simplified for now - comparing to "previous period" ideally, but reused 0% logic if unknown)
  // To do this properly we'd need to fetch previous period data.
  // For this iteration, I'll simulate or just show the static styles if actual comparison is complex to add right now.
  // Let's stick to the existing logic 'calculatePercentageChange' if we can preserve it, or simplify for the UI update focus.
  // I will reuse the monthly logic from before to get at least some comparison if possible, or just mock it for "UI likeness" if acceptable.
  // Let's bring back the monthly data calculation for the change percentages.

  if (dashboardStyle === "financial-pulse") {
    return <FinancialPulseDashboard />;
  }

  return (
    <div className="space-y-6 p-6 rounded-xl min-h-[calc(100vh-100px)] transition-all duration-500 bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="flex flex-col gap-6 mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              Dashboard
            </h1>
            <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
              Overview of your financial health
            </p>
          </div>
        </div>

        {/* Search/Filter Bar */}
        <SearchFilterBar />

        {/* Metric Cards Row 1 */}
        <div className="grid gap-4 md:grid-cols-2">
          <RunwayCard />
          <BudgetStatusCard />
        </div>

        {/* Metric Cards Row 2 - Consolidated */}
        <ConsolidatedMetricsCard
          netWorth={formatCurrency(totalBalance)}
          income={formatCurrency(totalIncome)}
          expenses={formatCurrency(totalExpenses)}
        />

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-12 h-[500px]">
          {/* Chart Section - Takes up 8 columns (approx 2/3) */}
          <div className="md:col-span-8 h-full">
            <StackedCategoryChart
              transactions={filteredTransactions}
              className="h-full shadow-sm"
            />
          </div>

          {/* Activity Feed - Takes up 4 columns (approx 1/3) */}
          <div className="md:col-span-4 h-full">
            <RecentActivityFeed
              transactions={filteredTransactions}
              className="h-full shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
