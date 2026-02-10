import { useEffect, useState, useMemo } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useLedger } from "@/contexts/LedgerContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Budget } from "@/types/budgets";
import { calculateBudgetSpent } from "@/utils/budgetUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Edit, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AddEditBudgetDialog } from "@/components/budgets/AddEditBudgetDialog";
import { startOfMonth, subMonths, endOfMonth, isWithinInterval } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Insights() {
    const { transactions, accounts, vendors } = useTransactions();
    const { activeLedger } = useLedger();
    const dataProvider = useDataProvider();
    const { convertBetweenCurrencies, formatCurrency } = useCurrency();
    const navigate = useNavigate();

    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination State - Budgets only
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

    // Fetch budgets logic
    const fetchBudgets = async () => {
        if (!activeLedger?.id) return;
        setIsLoading(true);
        try {
            const data = await dataProvider.getBudgetsWithSpending(activeLedger.id);
            setBudgets(data || []);
        } catch (error) {
            console.error("Error fetching budgets for insights:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, [activeLedger?.id, dataProvider]);

    // Budget Insights Logic
    const insights = useMemo(() => {
        if (!budgets.length) return [];

        return budgets.map(budget => {
            const spent = calculateBudgetSpent(
                budget,
                transactions,
                accounts as any,
                vendors,
                convertBetweenCurrencies,
                budget.currency
            );

            const total = budget.target_amount;
            const percentage = Math.min((spent / total) * 100, 100);
            const isOverBudget = spent > total;

            let status: 'good' | 'warning' | 'critical' = 'good';
            let message = "You are on track.";

            if (isOverBudget) {
                status = 'critical';
                message = `You have exceeded your planned ${formatCurrency(total, budget.currency)} by ${formatCurrency(spent - total, budget.currency)}.`;
            } else if (percentage > 85) {
                status = 'warning';
                message = `You have used ${percentage.toFixed(0)}% of your budget. Be careful with upcoming expenses.`;
            } else {
                message = `You've spent ${formatCurrency(spent, budget.currency)} of ${formatCurrency(total, budget.currency)}.`;
            }

            return {
                budget,
                spent,
                percentage,
                status,
                message
            };
        }).filter(i => i.budget.is_active !== false);
    }, [budgets, transactions, accounts, vendors, convertBetweenCurrencies, formatCurrency]);

    const sortedInsights = useMemo(() => {
        return [...insights].sort((a, b) => {
            const priority = { critical: 3, warning: 2, good: 1 };
            return priority[b.status] - priority[a.status];
        });
    }, [insights]);

    // Budget Pagination Logic
    const totalPages = Math.ceil(sortedInsights.length / itemsPerPage);
    const paginatedInsights = sortedInsights.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(p => p + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(p => p - 1);
    };

    const handleCardClick = (budget: Budget) => {
        setSelectedBudget(budget);
        setIsDialogOpen(true);
    };

    const handleDialogSuccess = () => {
        fetchBudgets();
    };

    // Trend Analysis Logic
    const { topAccountTrends, topVendorTrends } = useMemo(() => {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        const prevMonthStart = startOfMonth(subMonths(now, 1));
        const prevMonthEnd = endOfMonth(subMonths(now, 1));

        const currentMonthTxs = transactions.filter(t =>
            !t.is_scheduled_origin &&
            isWithinInterval(new Date(t.date), { start: currentMonthStart, end: currentMonthEnd })
        );

        const prevMonthTxs = transactions.filter(t =>
            !t.is_scheduled_origin &&
            isWithinInterval(new Date(t.date), { start: prevMonthStart, end: prevMonthEnd })
        );

        const analyzeEntity = (entityName: string, type: 'Vendor' | 'Account') => {
            const currentTxs = currentMonthTxs.filter(t =>
                (type === 'Vendor' ? t.vendor : t.account) === entityName
            );

            const prevTxs = prevMonthTxs.filter(t =>
                (type === 'Vendor' ? t.vendor : t.account) === entityName
            );

            // Only consider if there is activity in at least one month
            if (currentTxs.length === 0 && prevTxs.length === 0) return null;

            if (type === 'Account') {
                const currentCount = currentTxs.length;
                const prevCount = prevTxs.length;
                const diff = currentCount - prevCount;

                if (Math.abs(diff) < 2) return null; // Ignore tiny variance

                const percentVal = prevCount > 0 ? (diff / prevCount) * 100 : (currentCount > 0 ? Infinity : 0);
                const direction = diff > 0 ? "increasing" : "decreasing";

                return {
                    entity: entityName,
                    type,
                    metric: 'Frequency',
                    currentValue: currentCount,
                    prevValue: prevCount,
                    diff,
                    absDiff: Math.abs(diff),
                    percentVal,
                    direction,
                    message: `${currentCount} vs ${prevCount} last month`
                };
            } else {
                // Vendor Amount Analysis
                const currentAmount = currentTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                const prevAmount = prevTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                const diff = currentAmount - prevAmount;

                if (Math.abs(diff) < 10) return null; // Ignore < 10 currency unit diff

                const percentVal = prevAmount > 0 ? (diff / prevAmount) * 100 : (currentAmount > 0 ? Infinity : 0);
                const direction = diff > 0 ? "increasing" : "decreasing";
                const currency = currentTxs[0]?.currency || prevTxs[0]?.currency || 'USD';

                return {
                    entity: entityName,
                    type,
                    metric: 'Spending',
                    currentValue: currentAmount,
                    prevValue: prevAmount,
                    diff,
                    absDiff: Math.abs(diff),
                    percentVal,
                    direction,
                    currency,
                    message: `${formatCurrency(currentAmount, currency)} vs ${formatCurrency(prevAmount, currency)} last month`
                };
            }
        };

        const interestingEntities = new Set<string>();
        [...currentMonthTxs, ...prevMonthTxs].forEach(t => {
            if (t.vendor) interestingEntities.add(t.vendor);
            if (t.account) interestingEntities.add(t.account);
        });

        const accountAnalyses = [];
        const vendorAnalyses = [];

        for (const entity of interestingEntities) {
            const isAccount = accounts.some(a => a.name === entity);
            const isVendor = vendors.some(v => v.name === entity);

            if (isAccount) {
                const analysis = analyzeEntity(entity, 'Account');
                if (analysis) accountAnalyses.push(analysis);
            } else if (isVendor || !isAccount) {
                const analysis = analyzeEntity(entity, 'Vendor');
                if (analysis) vendorAnalyses.push(analysis);
            }
        }

        // Sorting Logic: 
        // 1. Abs(% Change) DESC
        // 2. Abs(Value Change) DESC
        // 3. Alphabetical ASC
        const sortFn = (a: any, b: any) => {
            const pA = Math.abs(a.percentVal);
            const pB = Math.abs(b.percentVal);

            // Handle Infinity (New items) usually treated as highest change
            if (pA === Infinity && pB === Infinity) return b.absDiff - a.absDiff;
            if (pA === Infinity) return -1;
            if (pB === Infinity) return 1;

            if (Math.abs(pA - pB) > 1) { // 1% tolerance for "same percentage"
                return pB - pA;
            }

            // Clash on percentage, verify actual number difference difference
            if (Math.abs(b.absDiff - a.absDiff) > 0.01) {
                return b.absDiff - a.absDiff;
            }

            // Alphabetical
            return a.entity.localeCompare(b.entity);
        };

        return {
            topAccountTrends: accountAnalyses.sort(sortFn).slice(0, 5),
            topVendorTrends: vendorAnalyses.sort(sortFn).slice(0, 5)
        };

    }, [transactions, accounts, vendors, formatCurrency]);

    const handleTrendClick = (trend: any) => {
        const now = new Date();
        const range = {
            from: startOfMonth(now),
            to: endOfMonth(now)
        };

        navigate('/transactions', {
            state: {
                filterAccount: trend.type === 'Account' ? trend.entity : undefined,
                filterVendor: trend.type === 'Vendor' ? trend.entity : undefined,
                dateRange: range
            }
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-10 w-[200px]" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-[200px] w-full rounded-xl" />)}
                </div>
            </div>
        );
    }

    const renderTrendItem = (trend: any) => (
        <div
            key={trend.entity}
            onClick={() => handleTrendClick(trend)}
            className="flex items-center justify-between p-3 rounded-lg border bg-card/60 hover:bg-card hover:shadow-md cursor-pointer transition-all text-card-foreground group"
        >
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full",
                    trend.direction === 'increasing' && trend.type === 'Vendor' ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                        trend.direction === 'increasing' && trend.type === 'Account' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" :
                            "bg-green-100 text-green-600 dark:bg-green-900/30"
                )}>
                    {trend.direction === 'increasing' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                </div>
                <div>
                    <div className="font-medium flex items-center gap-2 group-hover:text-primary transition-colors">
                        {trend.entity}
                        <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-bold",
                            trend.direction === 'increasing' && trend.type === 'Vendor' ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                        )}>
                            {trend.percentVal === Infinity ? 'New' : `${trend.percentVal > 0 ? '+' : ''}${Math.round(trend.percentVal)}%`}
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                        {trend.message}
                    </div>
                </div>
            </div>
            <div className={cn("text-sm font-semibold",
                trend.type === 'Account' ? "text-slate-600 dark:text-slate-400" :
                    trend.diff > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
            )}>
                {trend.type === 'Account' ? (
                    <span>{trend.diff > 0 ? '+' : ''}{trend.diff} Txns</span>
                ) : (
                    <span>{trend.diff > 0 ? '+' : ''}{formatCurrency(trend.diff, trend.currency)}</span>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 p-6 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
                <p className="text-muted-foreground mt-2">
                    AI-powered analysis of your spending trends vs. planned budgets.
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Budget Analysis</h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {sortedInsights.length} Active Budgets
                    </span>
                </div>

                {sortedInsights.length === 0 ? (
                    <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertTitle>No Insights Available</AlertTitle>
                        <AlertDescription>
                            Create some budgets and add transactions to see insights here.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {paginatedInsights.map((item) => (
                                <Card
                                    key={item.budget.id}
                                    className={cn(
                                        "border-l-4 shadow-sm transition-all hover:shadow-md cursor-pointer group relative overflow-hidden",
                                        item.status === 'critical' ? "border-l-red-500" :
                                            item.status === 'warning' ? "border-l-yellow-500" :
                                                "border-l-emerald-500"
                                    )}
                                    onClick={() => handleCardClick(item.budget)}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                                                {item.budget.category_name}
                                            </CardTitle>
                                            {item.status === 'critical' ? <AlertTriangle className="h-5 w-5 text-red-500" /> :
                                                item.status === 'warning' ? <TrendingUp className="h-5 w-5 text-yellow-500" /> :
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                        </div>
                                        <CardDescription>
                                            {item.budget.frequency} Budget
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span>Spent: {formatCurrency(item.spent, item.budget.currency)}</span>
                                                    <span className="text-muted-foreground">of {formatCurrency(item.budget.target_amount, item.budget.currency)}</span>
                                                </div>
                                                <Progress
                                                    value={item.percentage}
                                                    className={cn("h-2",
                                                        item.status === 'critical' ? "bg-red-100 dark:bg-red-900/20 [&>div]:bg-red-500" :
                                                            item.status === 'warning' ? "bg-yellow-100 dark:bg-yellow-900/20 [&>div]:bg-yellow-500" :
                                                                "bg-emerald-100 dark:bg-emerald-900/20 [&>div]:bg-emerald-500"
                                                    )}
                                                />
                                            </div>

                                            <div className="bg-muted/50 p-3 rounded-md text-sm italic border border-border/50">
                                                "{item.message}"
                                            </div>

                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                <span className="text-xs text-muted-foreground mr-2 group-hover:hidden">Click to edit</span>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hidden group-hover:inline-flex bg-background shadow-sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-end space-x-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Usage Trends Section - Split Layout */}
            {(topAccountTrends.length > 0 || topVendorTrends.length > 0) && (
                <div className="pt-6 border-t md:grid md:grid-cols-2 gap-8">
                    {/* Account Trends */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            <h2 className="text-xl font-semibold">Top Account Activity</h2>
                        </div>
                        {topAccountTrends.length === 0 ? (
                            <div className="text-sm text-muted-foreground italic">No significant account changes.</div>
                        ) : (
                            <div className="space-y-3">
                                {topAccountTrends.map(renderTrendItem)}
                            </div>
                        )}
                    </div>

                    {/* Vendor Trends */}
                    <div className="space-y-4 mt-8 md:mt-0">
                        <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            <h2 className="text-xl font-semibold">Top Vendor Spending</h2>
                        </div>
                        {topVendorTrends.length === 0 ? (
                            <div className="text-sm text-muted-foreground italic">No significant spending changes.</div>
                        ) : (
                            <div className="space-y-3">
                                {topVendorTrends.map(renderTrendItem)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Budget Edit Dialog */}
            {activeLedger && (
                <AddEditBudgetDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    budget={selectedBudget}
                    allBudgets={budgets}
                    onSuccess={handleDialogSuccess}
                />
            )}
        </div>
    );
}
