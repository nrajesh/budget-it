import React from "react";
import { InsightCard } from "./InsightCard";
import { PieChart, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryData {
    name: string;
    amount: number;
    percentage: number;
    color: string;
}

interface TopCategoriesListProps {
    categories: CategoryData[];
    currencyFormatter: (value: number) => string;
}

export const TopCategoriesList = ({ categories, currencyFormatter }: TopCategoriesListProps) => {
    return (
        <InsightCard
            title="Top Spenders"
            className="md:col-span-1 min-h-[300px]"
            icon={<List className="w-5 h-5" />}
        >
            <div className="space-y-4 mt-4">
                {categories.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="group relative">
                        <div className="flex justify-between items-end mb-1 relative z-10">
                            <span className="text-white font-medium text-sm">{cat.name}</span>
                            <span className="text-white/70 text-sm font-mono">{currencyFormatter(cat.amount)}</span>
                        </div>

                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                            <div
                                className={cn("h-full rounded-full transition-all duration-1000 ease-out", cat.color)}
                                style={{ width: `${cat.percentage}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-white/40 mt-1 text-right">{cat.percentage.toFixed(0)}% of total</div>
                    </div>
                ))}
                {categories.length === 0 && (
                    <div className="text-white/30 text-center py-10">No category data yet</div>
                )}
            </div>
        </InsightCard>
    );
};
