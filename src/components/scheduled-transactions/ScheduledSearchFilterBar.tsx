import * as React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { parseSearchQuery } from "@/utils/searchParser";
import { NLPSearchInput } from "@/components/ui/NLPSearchInput";
import { LocalFilterState } from "@/hooks/transactions/useLocalTransactionFilters";
import { useTransactions } from "@/contexts/TransactionsContext";
import { slugify } from "@/lib/utils";
// import { ActiveFiltersDisplay } from "@/components/filters/ActiveFiltersDisplay";

// Mock version of ActiveFiltersDisplay that accepts local state props?
// The original ActiveFiltersDisplay likely uses the global hook internally.
// We might need to duplicate it or simple inline display for now to avoid refactoring the global one.
// Let's create a local version of chips display or accept we might not show chips yet for this first pass?
// Actually, `ActiveFiltersDisplay.tsx` probably imports `useTransactionFilters`.
// I will just implement a simpler inline display for now or check if I can refactor ActiveFiltersDisplay later.
// For now: Just the Input.

interface Props {
  filterState: LocalFilterState;
  targetId?: string | null;
  onClearId?: () => void;
}

export const ScheduledSearchFilterBar: React.FC<Props> = ({
  filterState,
  targetId,
  onClearId,
}) => {
  const {
    setSearchTerm,
    setDateRange,
    setSelectedAccounts,
    setSelectedCategories,
    setSelectedSubCategories,
    setSelectedVendors,
    handleResetFilters,
    // setExcludeTransfers,
    setMinAmount,
    setMaxAmount,
    setLimit,
    setSortOrder,
    rawSearchQuery,
    setRawSearchQuery,
  } = filterState;

  const { categories, allSubCategories, accounts, vendors } = useTransactions();
  // const { isFinancialPulse } = useTheme(); // Unused for now

  const handleSearch = (value: string) => {
    setRawSearchQuery(value);

    const update = parseSearchQuery(value, {
      categories: categories.map((c) => ({
        name: c.name,
        slug: slugify(c.name),
      })),
      subCategories: allSubCategories.map((s) => ({
        name: s,
        slug: slugify(s),
      })),
      accounts: accounts.map((a) => ({
        name: a.name,
        slug: slugify(a.name),
        type: a.type,
      })),
      vendors: vendors.map((v) => ({ name: v.name, slug: slugify(v.name) })),
    });

    if (update.dateRange) setDateRange(update.dateRange);
    if (update.selectedCategories)
      setSelectedCategories(update.selectedCategories);
    if (update.selectedSubCategories)
      setSelectedSubCategories(update.selectedSubCategories);
    if (value.trim().length > 0) {
      setSelectedAccounts(update.selectedAccounts || []);
    } else {
      if (update.selectedAccounts) setSelectedAccounts(update.selectedAccounts);
    }
    if (update.selectedVendors) setSelectedVendors(update.selectedVendors);
    if (update.minAmount !== undefined) setMinAmount(update.minAmount);
    else setMinAmount(undefined);
    if (update.maxAmount !== undefined) setMaxAmount(update.maxAmount);
    else setMaxAmount(undefined);
    if (update.limit !== undefined) setLimit(update.limit);
    else setLimit(undefined);
    if (update.sortOrder !== undefined) setSortOrder(update.sortOrder);
    else setSortOrder(undefined);

    if (update.searchTerm !== undefined) setSearchTerm(update.searchTerm);
  };

  const handleReset = () => {
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
        placeholder="Search future transactions (e.g. 'Rent next month', 'Netflix')..."
      />

      <div className="flex items-center justify-end px-1 gap-2 flex-wrap">
        {targetId && (
          <div className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium animate-in fade-in zoom-in-95">
            <span>Filtered by Reference</span>
            <button
              onClick={onClearId}
              className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Clear reference filter</span>
            </button>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="h-8"
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Reset
        </Button>
      </div>
    </div>
  );
};
