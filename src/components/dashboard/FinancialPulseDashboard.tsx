import { useMemo } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Wealthometer } from "@/components/infographic/Wealthometer";
import { MonthlyTrends } from "@/components/infographic/MonthlyTrends";
import { TopCategoriesList } from "@/components/infographic/TopCategoriesList";
import { startOfMonth, subDays, isAfter, format } from "date-fns";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const FinancialPulseDashboard = () => {
    const { transactions, accounts } = useTransactions();
    const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
    const { excludeTransfers, setExcludeTransfers } = useTransactionFilters();

    // --- Data Aggregation ---

    // 1. Net Worth (Sum of all accounts)
    const netWorth = useMemo(() => {
        return accounts.reduce((total, account) => {
            const balance = account.running_balance || 0;
            return total + convertBetweenCurrencies(balance, account.currency || 'USD', selectedCurrency || 'USD');
        }, 0);
    }, [accounts, selectedCurrency, convertBetweenCurrencies]);


    // 2. Monthly Flow (Income vs Expenses for current month)
    const monthlyFlow = useMemo(() => {
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);

        let income = 0;
        let expenses = 0;

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (isAfter(tDate, startOfCurrentMonth)) {
                if (excludeTransfers && t.category === 'Transfer') return;

                const amount = convertBetweenCurrencies(Math.abs(t.amount), t.currency || 'USD', selectedCurrency || 'USD');
                if (t.amount > 0) income += amount;
                else if (t.amount < 0 && (t.category !== 'Transfer' || !excludeTransfers)) expenses += amount;
            }
        });

        return { income, expenses };
    }, [transactions, selectedCurrency, convertBetweenCurrencies, excludeTransfers]);


    // 3. 30 Day Trend
    const trendData = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);

        // Initialize map with dates
        const dailyMap = new Map<string, number>();
        for (let i = 0; i <= 30; i++) {
            const d = subDays(today, 30 - i);
            dailyMap.set(format(d, 'yyyy-MM-dd'), 0);
        }

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (isAfter(tDate, thirtyDaysAgo) && t.amount < 0) {
                if (excludeTransfers && t.category === 'Transfer') return;

                const dateKey = format(tDate, 'yyyy-MM-dd');
                if (dailyMap.has(dateKey)) {
                    const current = dailyMap.get(dateKey) || 0;
                    dailyMap.set(dateKey, current + convertBetweenCurrencies(Math.abs(t.amount), t.currency || 'USD', selectedCurrency || 'USD'));
                }
            }
        });

        return Array.from(dailyMap.entries()).map(([date, amount]) => ({
            date: format(new Date(date), 'MMM dd'),
            amount
        }));
    }, [transactions, selectedCurrency, convertBetweenCurrencies, excludeTransfers]);


    // 4. Top Categories (Last 30 Days)
    const topCategories = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);
        const catMap = new Map<string, number>();
        let totalSpent = 0;

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (isAfter(tDate, thirtyDaysAgo) && t.amount < 0) {
                if (excludeTransfers && t.category === 'Transfer') return;

                const amount = convertBetweenCurrencies(Math.abs(t.amount), t.currency || 'USD', selectedCurrency || 'USD');
                const cat = t.category || "Uncategorized";
                catMap.set(cat, (catMap.get(cat) || 0) + amount);
                totalSpent += amount;
            }
        });

        const colors = [
            "bg-emerald-500", "bg-blue-500", "bg-indigo-500", "bg-violet-500",
            "bg-fuchsia-500", "bg-pink-500", "bg-rose-500"
        ];

        return Array.from(catMap.entries())
            .sort((a, b) => b[1] - a[1]) // Sort desc
            .slice(0, 5)
            .map(([name, amount], idx) => ({
                name,
                amount,
                percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
                color: colors[idx % colors.length]
            }));
    }, [transactions, selectedCurrency, convertBetweenCurrencies, excludeTransfers]);


    return (
        <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-black p-4 md:p-8 text-white rounded-xl shadow-2xl min-h-[calc(100vh-100px)] transition-all duration-500">
            <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                            Financial Pulse
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">Your wealth at a glance.</p>

                        {/* Pulse specific toggle */}
                        <div className="flex items-center space-x-2 mt-4 bg-slate-800/40 p-2 rounded-lg border border-slate-700/50 w-fit">
                            <Switch
                                id="exclude-transfers-pulse"
                                checked={excludeTransfers}
                                onCheckedChange={setExcludeTransfers}
                                className="data-[state=checked]:bg-indigo-500"
                            />
                            <Label htmlFor="exclude-transfers-pulse" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Exclude Transfers</Label>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500 uppercase tracking-widest font-semibold">Current Balance</div>
                        <div className="text-2xl font-bold font-mono text-white">{formatCurrency(netWorth)}</div>
                    </div>
                </div>

                <Wealthometer
                    netWorth={netWorth}
                    monthlyIncome={monthlyFlow.income}
                    monthlyExpenses={monthlyFlow.expenses}
                    currencyFormatter={formatCurrency}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MonthlyTrends data={trendData} currencyFormatter={formatCurrency} />
                    <TopCategoriesList categories={topCategories} currencyFormatter={formatCurrency} />
                </div>
            </div>
        </div>
    );
};
