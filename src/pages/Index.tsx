import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"; // Added icons
import { cn, slugify } from "@/lib/utils";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { SearchFilterBar } from "@/components/filters/SearchFilterBar";
import { FinancialPulseDashboard } from "@/components/dashboard/FinancialPulseDashboard";
import { useTheme } from "@/contexts/ThemeContext";

// New Components
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { StackedCategoryChart } from "@/components/dashboard/StackedCategoryChart";

const Index = () => {
  const { transactions } = useTransactions();
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const { dashboardStyle } = useTheme();

  const {
    selectedAccounts,
    selectedCategories,
    excludeTransfers,
    dateRange
  } = useTransactionFilters();



  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by Date Range
    if (dateRange?.from) {
      filtered = filtered.filter(t => new Date(t.date) >= dateRange.from!);
    }
    if (dateRange?.to) {
      filtered = filtered.filter(t => new Date(t.date) <= dateRange.to!);
    }

    if (excludeTransfers) {
      filtered = filtered.filter(t => t.category !== 'Transfer');
    }

    if (selectedAccounts.length > 0) {
      filtered = filtered.filter(t => selectedAccounts.includes(slugify(t.account)));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(slugify(t.category)));
    }

    return filtered;
  }, [transactions, selectedAccounts, selectedCategories, excludeTransfers, dateRange]);

  // Calculate Metrics
  const { totalIncome, totalExpenses, totalBalance } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let balance = 0;

    filteredTransactions.forEach(t => {
      // For balance, we sum everything (unless filtered out by logic above)
      // Note: "Total Balance" usually implies current state of accounts, 
      // but here it seems to represent "Net Change" in the selected period if filters are active.
      // However, if no date filter, it's net worth.
      const amount = convertBetweenCurrencies(t.amount, t.currency || 'USD', selectedCurrency || 'USD');

      // Handle Income/Expense calculation
      if (t.amount > 0) {
        if (t.category !== 'Transfer' || !excludeTransfers) {
          income += amount;
        }
      } else {
        if (t.category !== 'Transfer' || !excludeTransfers) {
          expenses += Math.abs(amount);
        }
      }

      // Handle Balance
      // If excludes transfers is on, balance calc might be weird if we just sum? 
      // Usually transfers net to 0, so excluding them shouldn't change total balance unless inter-account.
      if (t.category !== 'Transfer' || !excludeTransfers) {
        balance += amount;
      }
    });

    return { totalIncome: income, totalExpenses: expenses, totalBalance: balance };
  }, [filteredTransactions, selectedCurrency, convertBetweenCurrencies, excludeTransfers]);

  // Calculate Percentage Changes (Simplified for now - comparing to "previous period" ideally, but reused 0% logic if unknown)
  // To do this properly we'd need to fetch previous period data. 
  // For this iteration, I'll simulate or just show the static styles if actual comparison is complex to add right now.
  // Let's stick to the existing logic 'calculatePercentageChange' if we can preserve it, or simplify for the UI update focus.
  // I will reuse the monthly logic from before to get at least some comparison if possible, or just mock it for "UI likeness" if acceptable.
  // Let's bring back the monthly data calculation for the change percentages.

  const monthlyData = useMemo(() => {
    const inc: Record<string, number> = {};
    const exp: Record<string, number> = {};
    const bal: Record<string, number> = {};

    filteredTransactions.forEach(t => {
      if (excludeTransfers && t.category === 'Transfer') return;
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amount = convertBetweenCurrencies(t.amount, t.currency || 'USD', selectedCurrency || 'USD');

      if (t.amount > 0) inc[key] = (inc[key] || 0) + amount;
      else exp[key] = (exp[key] || 0) + Math.abs(amount);

      bal[key] = (bal[key] || 0) + amount;
    });
    return { inc, exp, bal };
  }, [filteredTransactions, excludeTransfers, convertBetweenCurrencies, selectedCurrency]);

  const calculateChange = (data: Record<string, number>) => {
    const keys = Object.keys(data).sort();
    if (keys.length < 2) return { value: "0%", isPositive: true }; // Default
    const curr = data[keys[keys.length - 1]] || 0;
    const prev = data[keys[keys.length - 2]] || 0;
    if (prev === 0) return { value: "0%", isPositive: true };
    const pct = ((curr - prev) / prev) * 100;
    return { value: `${Math.abs(pct).toFixed(1)}%`, isPositive: pct >= 0 };
  };


  // Net worth change is trickier, simplified to just monthly flow change for now
  const balanceChange = calculateChange(monthlyData.bal);


  // Helper for pill styles
  const getPillStyle = (isPositive: boolean, inverse = false) => {
    // Inverse: for expenses, positive change (more expenses) is bad (red)
    let good = isPositive;
    if (inverse) good = !isPositive;

    return cn(
      "text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium",
      good
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
    );
  };

  if (dashboardStyle === 'financial-pulse') {
    return <FinancialPulseDashboard />;
  }

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your financial health</p>
          </div>
        </div>

        {/* Search/Filter Bar */}
        <SearchFilterBar />

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Balance / Net Worth */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                Net Worth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{formatCurrency(totalBalance)}</span>
                <span className={getPillStyle(balanceChange.isPositive)}>
                  {balanceChange.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {balanceChange.value}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Income */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Monthly Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{formatCurrency(totalIncome)}</span>
                {/* 
                            Income change logic: usually implies vs last month. 
                            We can show it if we trust the calc, or just disable if it's confusing.
                            Keeping it for "sleek" look.
                        */}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Expenses */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                Monthly Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{formatCurrency(totalExpenses)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-12 h-[500px]">
          {/* Chart Section - Takes up 8 columns (approx 2/3) */}
          <div className="md:col-span-8 h-full">
            <StackedCategoryChart transactions={filteredTransactions} className="h-full shadow-sm" />
          </div>

          {/* Activity Feed - Takes up 4 columns (approx 1/3) */}
          <div className="md:col-span-4 h-full">
            <RecentActivityFeed transactions={filteredTransactions} className="h-full shadow-sm" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;