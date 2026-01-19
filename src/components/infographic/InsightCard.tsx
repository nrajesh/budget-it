import React from "react";
import { cn } from "@/lib/utils";

interface InsightCardProps {
    title: string;
    value?: string | number;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export const InsightCard = ({ title, value, icon, children, className, trend }: InsightCardProps) => {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl border p-6 shadow-xl transition-all duration-300 hover:scale-[1.02] group",
            // Light Mode Styles
            "bg-white/70 border-slate-200 text-slate-900",
            // Dark Mode Styles
            "dark:bg-black/20 dark:border-white/10 dark:text-white dark:backdrop-blur-md",
            "hover:bg-slate-50 dark:hover:bg-black/30",
            className
        )}>
            {/* Gradient Overlay - Subtle in light, existing style in dark */}
            <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-slate-100/50 to-transparent dark:from-white/5" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-sm font-medium tracking-wider uppercase text-slate-500 dark:text-white/60">{title}</h3>
                    {icon && <div className="p-2 rounded-full bg-slate-100/80 text-slate-500 dark:bg-white/5 dark:text-white/40">{icon}</div>}
                </div>

                {value !== undefined && (
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</span>
                        {trend && (
                            <span className={cn(
                                "text-sm font-medium mb-1 px-2 py-0.5 rounded-full",
                                trend.isPositive
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                    : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                            )}>
                                {trend.isPositive ? "+" : ""}{trend.value}%
                            </span>
                        )}
                    </div>
                )}

                {children}
            </div>
        </div>
    );
};
