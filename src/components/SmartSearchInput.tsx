import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search, X, RefreshCw } from "lucide-react";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { parseSearchQuery } from "@/utils/searchParser";
import { useTransactions } from "@/contexts/TransactionsContext";
import { slugify } from "@/lib/utils";

const PLACEHOLDERS = [
    "All transactions in past 2 weeks",
    "All Grocery transactions",
    "Spending > 100",
    "Transactions from Checking",
    "Starbucks last month"
];

export const SmartSearchInput = () => {
    const {
        setSearchTerm,
        setDateRange,
        setSelectedAccounts,
        setSelectedCategories,
        setSelectedSubCategories,
        setSelectedVendors,
        handleResetFilters,
        excludeTransfers,
        setExcludeTransfers,
        setMinAmount,
        setMaxAmount,
        setLimit,
        setSortOrder,
        rawSearchQuery,
        setRawSearchQuery
    } = useTransactionFilters();

    const { categories, allSubCategories, accounts, vendors } = useTransactions();
    // Directly use rawSearchQuery from context to ensure persistence
    const [placeholderIndex, setPlaceholderIndex] = React.useState(0);

    // Rotate placeholders
    React.useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = (value: string) => {
        setRawSearchQuery(value);

        // Perform NLP parsing
        const update = parseSearchQuery(
            value,
            {
                categories: categories.map(c => ({ name: c.name, slug: slugify(c.name) })),
                subCategories: allSubCategories.map(s => ({ name: s, slug: slugify(s) })),
                accounts: accounts.map(a => ({ name: a.name, slug: slugify(a.name) })),
                vendors: vendors.map(v => ({ name: v.name, slug: slugify(v.name) }))
            }
        );

        // Apply updates
        if (update.dateRange) setDateRange(update.dateRange);
        if (update.selectedCategories) {
            setSelectedCategories(update.selectedCategories);
            // If "Transfer" category is selected (likely slug 'transfer' or 'transfers'), ensure we don't exclude them
            const hasTransfer = update.selectedCategories.some(s => s.toLowerCase().includes('transfer'));
            if (hasTransfer) {
                setExcludeTransfers(false);
            }
        }
        if (update.selectedSubCategories) setSelectedSubCategories(update.selectedSubCategories);
        if (update.selectedAccounts) setSelectedAccounts(update.selectedAccounts);
        if (update.selectedVendors) setSelectedVendors(update.selectedVendors);

        // Amount
        if (update.minAmount !== undefined) setMinAmount(update.minAmount);
        else setMinAmount(undefined);

        if (update.maxAmount !== undefined) setMaxAmount(update.maxAmount);
        else setMaxAmount(undefined);

        if (update.limit !== undefined) setLimit(update.limit);
        else setLimit(undefined);

        if (update.sortOrder !== undefined) setSortOrder(update.sortOrder);
        else setSortOrder(undefined);

        // Use the remaining text as the generic search term
        // We always set it, even if empty, to clear previous search term
        if (update.searchTerm !== undefined) setSearchTerm(update.searchTerm);
    };

    const handleReset = () => {
        setRawSearchQuery("");
        handleResetFilters();
    };

    return (
        <div className="w-full space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={rawSearchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9 pr-12 h-12 text-lg shadow-sm"
                    placeholder={PLACEHOLDERS[placeholderIndex]}
                />
                {rawSearchQuery && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => handleSearch("")}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Switch
                        id="exclude-transfers"
                        checked={excludeTransfers}
                        onCheckedChange={setExcludeTransfers}
                    />
                    <label htmlFor="exclude-transfers" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Exclude Transfers
                    </label>
                </div>

                <Button variant="outline" size="sm" onClick={handleReset} className="h-8">
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Reset
                </Button>
            </div>
        </div>
    );
};
