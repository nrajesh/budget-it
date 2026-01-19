
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { useTransactions } from "@/contexts/TransactionsContext";
import { slugify } from "@/lib/utils";

export const ActiveFiltersDisplay = () => {
    const {
        dateRange,
        selectedAccounts,
        selectedCategories,
        selectedSubCategories,
        selectedVendors
    } = useTransactionFilters();
    const { accounts, categories, vendors, allSubCategories } = useTransactions();

    return (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground px-1">
            <div className="flex gap-1">
                <span className="font-medium">Time Range:</span>
                <span>
                    {dateRange?.from ? (
                        <>
                            {dateRange.from.toLocaleDateString()}
                            {dateRange.to ? ` - ${dateRange.to.toLocaleDateString()}` : " - ..."}
                        </>
                    ) : (
                        "All Time"
                    )}
                </span>
            </div>

            <div className="flex gap-1">
                <span className="font-medium">Accounts:</span>
                <span>
                    {selectedAccounts.length > 0
                        ? accounts
                            .filter(a => selectedAccounts.includes(slugify(a.name)))
                            .map(a => a.name)
                            .join(", ")
                        : "All Accounts"
                    }
                </span>
            </div>

            {selectedCategories.length > 0 && (
                <div className="flex gap-1">
                    <span className="font-medium">Categories:</span>
                    <span>
                        {categories
                            .filter(c => selectedCategories.includes(slugify(c.name)))
                            .map(c => c.name)
                            .join(", ")}
                    </span>
                </div>
            )}

            {selectedSubCategories.length > 0 && (
                <div className="flex gap-1">
                    <span className="font-medium">Sub-categories:</span>
                    <span>
                        {allSubCategories
                            .filter(s => selectedSubCategories.includes(slugify(s)))
                            .join(", ")}
                    </span>
                </div>
            )}

            {selectedVendors.length > 0 && (
                <div className="flex gap-1">
                    <span className="font-medium">Payees:</span>
                    <span>
                        {vendors
                            .filter(v => selectedVendors.includes(slugify(v.name)))
                            .map(v => v.name)
                            .join(", ")}
                    </span>
                </div>
            )}
        </div>
    );
};
