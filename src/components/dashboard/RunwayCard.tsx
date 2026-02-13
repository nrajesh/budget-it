import { ArrowUpRight, ArrowDownRight, Infinity } from "lucide-react";
import { useFinancialRunway } from "@/hooks/dashboard/useFinancialRunway";
import { useCurrency } from "@/contexts/CurrencyContext";

export const RunwayCard = () => {
    const {
        runwayMonths,
        isInfinite,
        netCashFlow,
        monthlyFixed,
        monthlyDiscretionary,
        totalSavings
    } = useFinancialRunway();

    const { formatCurrency } = useCurrency();

    const formatDuration = (months: number) => {
        if (months < 1) return "< 1 Month";
        const years = Math.floor(months / 12);
        const remainingMonths = Math.floor(months % 12);

        if (years > 0) {
            return `${years} Year${years > 1 ? "s" : ""}${remainingMonths > 0 ? ` ${remainingMonths} Month${remainingMonths > 1 ? "s" : ""}` : ""}`;
        }
        return `${Math.floor(months)} Month${months !== 1 ? "s" : ""}`;
    };

    const burnRate = Math.abs(netCashFlow);

    return (
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all duration-300">
            {/* Background Gradient */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br ${isInfinite ? "from-emerald-500 to-teal-500" : (runwayMonths < 3 ? "from-rose-500 to-orange-500" : "from-blue-500 to-indigo-500")}`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Financial Runway
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Based on fixed expenses + recent spending
                        </p>
                    </div>
                    <div className={`p-2 rounded-full ${isInfinite ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : (runwayMonths < 3 ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400")}`}>
                        {isInfinite ? <Infinity className="w-5 h-5" /> : (runwayMonths < 3 ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />)}
                    </div>
                </div>

                <div className="mt-2">
                    <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {isInfinite ? "Infinite" : formatDuration(runwayMonths)}
                    </div>
                    <p className={`mt-1 text-sm font-medium ${isInfinite ? "text-emerald-500" : (runwayMonths < 6 ? "text-amber-500" : "text-slate-500")}`}>
                        {isInfinite ? "Savings are growing!" : `Savings cover ${formatCurrency(burnRate)}/mo burn`}
                    </p>
                </div>

                {/* Breakdown Progress Bar or Mini Stats */}
                <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Monthly Stats</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <div className="text-xs text-slate-400">Fixed Cost</div>
                            <div className="font-semibold text-slate-700 dark:text-slate-200">
                                {formatCurrency(Math.abs(monthlyFixed.expenses))}
                            </div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <div className="text-xs text-slate-400">Avg Spending</div>
                            <div className="font-semibold text-slate-700 dark:text-slate-200">
                                {formatCurrency(Math.abs(monthlyDiscretionary.expenses))}
                            </div>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-xs text-slate-400">Total Savings</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(totalSavings)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
