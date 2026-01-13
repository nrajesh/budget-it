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
            "relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md p-6 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:bg-black/30 group",
            className
        )}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-sm font-medium text-white/60 tracking-wider uppercase">{title}</h3>
                    {icon && <div className="text-white/40 p-2 bg-white/5 rounded-full">{icon}</div>}
                </div>

                {value !== undefined && (
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
                        {trend && (
                            <span className={cn(
                                "text-sm font-medium mb-1 px-2 py-0.5 rounded-full",
                                trend.isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
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
