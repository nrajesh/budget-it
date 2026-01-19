import * as React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { parseSearchQuery } from "@/utils/searchParser";
import { useTransactions } from "@/contexts/TransactionsContext";
import { slugify } from "@/lib/utils";
import { NLPSearchInput } from "@/components/ui/NLPSearchInput";



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
    // Rotate placeholders - functionality moved to NLPSearchInput, removing from here


    const handleSearch = (value: string) => {
        setRawSearchQuery(value);

        // Perform NLP parsing
        const update = parseSearchQuery(
            value,
            {
                categories: categories.map(c => ({ name: c.name, slug: slugify(c.name) })),
                subCategories: allSubCategories.map(s => ({ name: s, slug: slugify(s) })),
                accounts: accounts.map(a => ({ name: a.name, slug: slugify(a.name), type: a.type })),
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

        // Account logic: If searching, and no specific account found, reset to ALL (clearing default "Top 4")
        // If query is empty, allow existing logic (which might be manual selection or default) to persist, 
        // but handleReset usually handles clearing.
        if (value.trim().length > 0) {
            setSelectedAccounts(update.selectedAccounts || []);
        } else {
            // If search is cleared, do we restore defaults? 
            // For now, let's just leave it or let the user reset. 
            // But line 75 was: if (update.selectedAccounts) ... 
            if (update.selectedAccounts) setSelectedAccounts(update.selectedAccounts);
        }

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
            <NLPSearchInput
                value={rawSearchQuery}
                onChange={(val) => {
                    setRawSearchQuery(val);
                    handleSearch(val);
                }}
                onClear={() => handleSearch("")}
            />

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
