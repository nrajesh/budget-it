import React from "react";
import { InsightCard } from "./InsightCard";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils"; // Assuming this exists or I'll fix imports later

interface WealthometerProps {
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    currencyFormatter: (value: number) => string;
}

export const Wealthometer = ({ netWorth, monthlyIncome, monthlyExpenses, currencyFormatter }: WealthometerProps) => {
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <InsightCard
                title="Net Worth"
                value={currencyFormatter(netWorth)}
                icon={<Wallet className="w-5 h-5" />}
                className="lg:col-span-2 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/20"
            >
                <div className="mt-4 h-2 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-full animate-pulse" />
                </div>
                <p className="mt-2 text-xs text-white/50">Total across all accounts</p>
            </InsightCard>

            <InsightCard
                title="Monthly Flow"
                value={currencyFormatter(monthlyIncome - monthlyExpenses)}
                icon={<TrendingUp className="w-5 h-5" />}
                trend={{ value: Math.abs(Number(savingsRate.toFixed(1))), isPositive: savingsRate >= 0 }}
            >
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                        <span className="text-white/40 block">In</span>
                        <span className="text-emerald-400">{currencyFormatter(monthlyIncome)}</span>
                    </div>
                    <div>
                        <span className="text-white/40 block">Out</span>
                        <span className="text-rose-400">{currencyFormatter(monthlyExpenses)}</span>
                    </div>
                </div>
            </InsightCard>

            <InsightCard
                title="Savings Rate"
                value={`${savingsRate.toFixed(1)}%`}
                icon={<div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold">%</div>}
                className={savingsRate >= 20 ? "from-emerald-900/40" : "from-amber-900/40"}
            >
                <div className="mt-2 text-xs text-white/50">
                    {savingsRate >= 20 ? "Great job! creating wealth." : "Keep pushing to save more."}
                </div>
            </InsightCard>
        </div>
    );
};
