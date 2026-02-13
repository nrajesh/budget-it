import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface ConsolidatedMetricsCardProps {
    netWorth: string;
    income: string;
    expenses: string;
}

export const ConsolidatedMetricsCard = ({ netWorth, income, expenses }: ConsolidatedMetricsCardProps) => {
    return (
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">
                Overview &bull; {format(new Date(), "MMMM yyyy")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">

                {/* Net Worth */}
                <div className="flex flex-col gap-2 pt-4 md:pt-0">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                            <Wallet className="w-3.5 h-3.5" />
                        </div>
                        Net Worth
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {netWorth}
                    </div>
                </div>

                {/* Income */}
                <div className="flex flex-col gap-2 pt-4 md:pt-0 md:pl-8">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        Income
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {income}
                    </div>
                </div>

                {/* Expenses */}
                <div className="flex flex-col gap-2 pt-4 md:pt-0 md:pl-8">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
                        <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded text-rose-600 dark:text-rose-400">
                            <TrendingDown className="w-3.5 h-3.5" />
                        </div>
                        Expenses
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {expenses}
                    </div>
                </div>

            </div>
        </div>
    );
};
