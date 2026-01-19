
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Transaction } from "@/types/transaction"; // Assuming type is exposed or I can infer
import { cn, slugify } from "@/lib/utils";
import { ShoppingBag, Coffee, Home, Car, Zap, FileText, ArrowRightLeft, DollarSign } from "lucide-react";

// Fallback type if import fails
interface TransactionType {
    id: string;
    date: string;
    amount: number;
    currency?: string;
    vendor: string;
    category: string;
    sub_category?: string;
}

interface RecentActivityFeedProps {
    transactions: any[]; // Using any to avoid strict type issues if import path is wrong, but ideally use Transaction
    className?: string;
}

const getCategoryIcon = (category: string) => {
    const normalized = slugify(category);
    if (normalized.includes('food') || normalized.includes('dining')) return Coffee;
    if (normalized.includes('shop') || normalized.includes('grocer')) return ShoppingBag;
    if (normalized.includes('hous') || normalized.includes('rent')) return Home;
    if (normalized.includes('transport') || normalized.includes('car') || normalized.includes('gas')) return Car;
    if (normalized.includes('util') || normalized.includes('bill')) return Zap;
    if (normalized.includes('transfer')) return ArrowRightLeft;
    if (normalized.includes('income') || normalized.includes('salary')) return DollarSign;
    return FileText;
};

export const RecentActivityFeed = ({ transactions, className }: RecentActivityFeedProps) => {
    const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();

    // Sort by date desc and take top 5
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return (
        <Card className={cn("h-full", className)}>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Activity Feed</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {recentTransactions.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">No recent activity</div>
                ) : (
                    recentTransactions.map((t) => {
                        const Icon = getCategoryIcon(t.category);
                        const isExpense = t.amount < 0;
                        const amount = Math.abs(convertBetweenCurrencies(t.amount, t.currency || 'USD', selectedCurrency || 'USD'));

                        return (
                            <div key={t.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{t.vendor || t.description || 'Unknown'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className={cn("font-medium text-sm", isExpense ? "" : "text-green-600")}>
                                    {isExpense ? "-" : "+"}{formatCurrency(amount)}
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
};
