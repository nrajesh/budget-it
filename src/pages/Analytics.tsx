import * as React from "react";
import { BalanceOverTimeChart } from "@/components/BalanceOverTimeChart";
import { SpendingCategoriesChart } from "@/components/SpendingCategoriesChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { ScheduledTransactionsTable } from "@/components/ScheduledTransactionsTable";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useUser } from "@/contexts/UserContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { generateFutureTransactions, createScheduledTransactionsService } from "@/services/scheduledTransactionsService";
import { slugify, cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { useTransactionPairing } from "@/hooks/transactions/useTransactionPairing";
import { useTheme } from "@/contexts/ThemeContext";

const Analytics = () => {
  const { transactions, categories: allCategories, subCategories: allSubCategories, accountCurrencyMap, refetchTransactions } = useTransactions();
  const { user } = useUser();
  const { convertBetweenCurrencies } = useCurrency();
  const { isFinancialPulse } = useTheme();
  const [scheduledTransactions, setScheduledTransactions] = React.useState<any[]>([]);

  // Memoize the service creation
  const scheduledTransactionsService = React.useMemo(() =>
    createScheduledTransactionsService({
      refetchTransactions,
      userId: user?.id,
      convertBetweenCurrencies
    }),
    [refetchTransactions, user?.id, convertBetweenCurrencies]);

  React.useEffect(() => {
    const loadScheduled = async () => {
      try {
        const data = await scheduledTransactionsService.fetchScheduledTransactions();
        setScheduledTransactions(data);
      } catch (error) {
        console.error("Failed to fetch scheduled transactions", error);
      }
    };
    loadScheduled();
  }, [scheduledTransactionsService]);

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  // Filter transactions to exclude future-dated ones and apply date range
  // This logic is moved/kept but we will also filter projected transactions similarly
  const currentTransactions = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0);

      const isNotFuture = transactionDate <= today;
      const isInDateRange =
        (!dateRange?.from || transactionDate >= dateRange.from) &&
        (!dateRange?.to || transactionDate <= dateRange.to);

      return isNotFuture && isInDateRange;
    });
  }, [transactions, dateRange]);

  const projectedTransactions = React.useMemo(() => {
    const allProjected = generateFutureTransactions(scheduledTransactions, accountCurrencyMap);

    // Filter projected transactions based on date range
    if (!dateRange?.to && !dateRange?.from) return allProjected;
    // Actually we should filter by FROM as well if set?
    // "Scheduled" implies future usually, but if date range is future-only, we want correct subset.

    return allProjected.filter(t => {
      const tDate = new Date(t.date);

      const isInRange =
        (!dateRange?.from || tDate >= dateRange.from) &&
        (!dateRange?.to || tDate <= dateRange.to);

      return isInRange;
    });
  }, [scheduledTransactions, accountCurrencyMap, dateRange]);

  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [excludeTransfers, setExcludeTransfers] = React.useState<boolean>(false);

  // Filter transactions to exclude future-dated ones and apply date range
  const { pairedTransactionIds } = useTransactionPairing(currentTransactions);

  const availableAccounts = React.useMemo(() => {
    const uniqueAccounts = new Set<string>();
    currentTransactions.forEach(t => uniqueAccounts.add(t.account));
    return Array.from(uniqueAccounts).sort().map(account => ({
      value: slugify(account),
      label: account,
    }));
  }, [currentTransactions]);

  const availableVendors = React.useMemo(() => {
    const uniqueVendors = new Set<string>();
    currentTransactions.forEach(t => {
      if (t.vendor) uniqueVendors.add(t.vendor);
    });
    return Array.from(uniqueVendors).sort().map(vendor => ({
      value: slugify(vendor),
      label: vendor,
    }));
  }, [currentTransactions]);

  const availableCategories = React.useMemo(() => {
    return allCategories.map(category => ({
      value: slugify(category.name),
      label: category.name,
    }));
  }, [allCategories]);

  // Construct Category Tree Data
  const categoryTreeData = React.useMemo(() => {
    return allCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: slugify(cat.name),
      subCategories: allSubCategories
        .filter(sub => sub.category_id === cat.id)
        .map(sub => ({
          id: sub.id,
          name: sub.name,
          slug: slugify(sub.name)
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCategories, allSubCategories]);

  // ...

  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>(() => {
    // Calculate transaction counts per account
    const accountCounts = new Map<string, number>();
    currentTransactions.forEach(t => {
      accountCounts.set(t.account, (accountCounts.get(t.account) || 0) + 1);
    });

    // Sort accounts by frequency descending
    const sortedAccounts = availableAccounts.map(acc => ({
      ...acc,
      count: accountCounts.get(acc.label) || 0
    })).sort((a, b) => b.count - a.count);

    // Pick top 4 or all if less than 4
    return sortedAccounts.slice(0, 4).map(acc => acc.value);
  });


  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    availableCategories.map(cat => cat.value)
  );
  // Initialize to empty on first load or all? Usually empty means 'all implicitly' or 'none'. 
  // Given current logic for categories is "if empty, return all", let's replicate that or manage 'all selected'.
  // But wait, the previous logic explicitly initialized with ALL.
  // "availableCategories.map(cat => cat.value)"
  // So let's initialize sub-categories with ALL too? Or empty?
  // If we select a category, we usually select all its sub-cats.
  // So if all categories are selected, all sub-cats should be selected.
  const [selectedSubCategories, setSelectedSubCategories] = React.useState<string[]>([]);

  // Consolidated effect to initialize/sync categories and sub-categories
  React.useEffect(() => {
    // 1. Initialize Categories
    setSelectedCategories(prev => {
      const currentCategoryValues = availableCategories.map(cat => cat.value);
      // If none selected (initial) or if the count matches available (likely "select all" state), ensure all are selected
      if (prev.length === 0 || prev.length === currentCategoryValues.length) {
        return currentCategoryValues;
      }
      // Otherwise, keep only those that are still available
      return prev.filter(val => currentCategoryValues.includes(val));
    });

    // 2. Initialize Sub-categories
    setSelectedSubCategories(prev => {
      const currentSubCategoryValues = allSubCategories.map(s => slugify(s.name));

      // If we are in the "select all" state (which is indistinguishable from initial empty state currently, 
      // but usually desired on load), select all.
      // We check if prev is empty.
      if (prev.length === 0 && currentSubCategoryValues.length > 0) {
        return currentSubCategoryValues;
      }

      return prev;
    });
  }, [availableCategories, allSubCategories]);

  // Vendor state
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>(
    availableVendors.map(v => v.value)
  );

  React.useEffect(() => {
    setSelectedAccounts(prev => {
      const currentAccountValues = availableAccounts.map(acc => acc.value);

      if (prev.length === 0 && currentAccountValues.length > 0) {
        // Calculate top 4
        const accountCounts = new Map<string, number>();
        currentTransactions.forEach(t => {
          accountCounts.set(t.account, (accountCounts.get(t.account) || 0) + 1);
        });

        const sortedAccounts = availableAccounts.map(acc => ({
          ...acc,
          count: accountCounts.get(acc.label) || 0
        })).sort((a, b) => b.count - a.count);

        return sortedAccounts.slice(0, 4).map(acc => acc.value);
      }
      return prev.filter(val => currentAccountValues.includes(val));
    });
  }, [availableAccounts, currentTransactions]);

  React.useEffect(() => {
    setSelectedVendors(prev => {
      const currentVendorValues = availableVendors.map(v => v.value);
      if (prev.length === 0 || prev.length === currentVendorValues.length) {
        return currentVendorValues;
      }
      return prev.filter(val => currentVendorValues.includes(val));
    });
  }, [availableVendors]);

  React.useEffect(() => {
    setSelectedVendors(prev => {
      const currentVendorValues = availableVendors.map(v => v.value);
      if (prev.length === 0 || prev.length === currentVendorValues.length) {
        return currentVendorValues;
      }
      return prev.filter(val => currentVendorValues.includes(val));
    });
  }, [availableVendors]);


  // Common filtering function reusable for both recent and scheduled
  const filterTransactionData = React.useCallback((data: any[]) => {
    let filtered = data;

    if (selectedAccounts.length > 0) {
      filtered = filtered.filter(t => selectedAccounts.includes(slugify(t.account)));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => {
        const catSlug = slugify(t.category);
        const subSlug = t.sub_category ? slugify(t.sub_category) : null;

        if (!selectedCategories.includes(catSlug)) return false;

        if (subSlug) {
          const isKnownSubCategory = allSubCategories.some(s => slugify(s.name) === subSlug);
          if (isKnownSubCategory && !selectedSubCategories.includes(subSlug)) {
            return false;
          }
        }
        return true;
      });
    }

    if (selectedVendors.length > 0) {
      filtered = filtered.filter(t => t.vendor && selectedVendors.includes(slugify(t.vendor)));
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.vendor?.toLowerCase().includes(lowerCaseSearchTerm) ||
        t.category.toLowerCase().includes(lowerCaseSearchTerm) ||
        (t.remarks && t.remarks.toLowerCase().includes(lowerCaseSearchTerm)) ||
        t.account.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    if (excludeTransfers) {
      // For Scheduled, simple category check since pairing might not exist yet?
      // Or assume 'Transfer' category. 
      // Current pairing logic works on IDs. Projected ones have IDs? 
      // generateFutureTransactions usually gives pseudo IDs.
      // So using pairedTransactionIds set on scheduled might not work unless we pair them too.
      // For now, let's assume strict 'Transfer' category or if ID matches known pair (for recent).

      // Since function is generic, we check if ID is in list OR category is Transfer (fallback)
      filtered = filtered.filter(t => !pairedTransactionIds.has(t.id) && t.category !== 'Transfer');
    }

    return filtered;
  }, [selectedAccounts, selectedCategories, selectedSubCategories, selectedVendors, searchTerm, excludeTransfers, pairedTransactionIds, allSubCategories]);

  const filteredTransactions = React.useMemo(() => {
    return filterTransactionData(currentTransactions);
  }, [currentTransactions, filterTransactionData]);

  const filteredScheduledTransactions = React.useMemo(() => {
    return filterTransactionData(projectedTransactions);
  }, [projectedTransactions, filterTransactionData]);

  const handleResetFilters = () => {
    setDateRange({
      from: addDays(new Date(), -30),
      to: new Date(),
    });
    setSelectedAccounts(availableAccounts.map(acc => acc.value));
    setSelectedCategories(availableCategories.map(cat => cat.value));
    // Reset subs to all
    setSelectedSubCategories(allSubCategories.map(s => slugify(s.name)));
    setSelectedVendors(availableVendors.map(v => v.value));
    setSearchTerm("");
    setExcludeTransfers(false);
  };

  return (
    <div className={cn(
      "space-y-4 transition-colors duration-500",
      isFinancialPulse ? "bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6 rounded-xl -m-6 min-h-[calc(100vh-100px)] text-white" : ""
    )}>
      {isFinancialPulse && (
        <div className="mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Analytics Pulse
          </h1>
          <p className="text-slate-400 mt-2">Deep dive into your financial health.</p>
        </div>
      )}

      <TransactionFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        availableAccountOptions={availableAccounts}
        selectedAccounts={selectedAccounts}
        setSelectedAccounts={setSelectedAccounts}

        // Pass Tree Data
        categoryTreeData={categoryTreeData}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedSubCategories={selectedSubCategories}
        setSelectedSubCategories={setSelectedSubCategories}

        availableVendorOptions={availableVendors}
        selectedVendors={selectedVendors}
        setSelectedVendors={setSelectedVendors}
        dateRange={dateRange}
        onDateChange={setDateRange}
        excludeTransfers={excludeTransfers}
        onExcludeTransfersChange={setExcludeTransfers}
        onResetFilters={handleResetFilters}
      />
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BalanceOverTimeChart
            transactions={filteredTransactions}
            projectedTransactions={filteredScheduledTransactions}
            dateRange={dateRange}
          />
        </div>
        <div className="lg:col-span-1">
          <SpendingCategoriesChart transactions={filteredTransactions} />
        </div>
      </div>

      {filteredTransactions.length > 0 && (
        <RecentTransactions transactions={filteredTransactions} selectedCategories={selectedCategories.map(slugify)} />
      )}

      <ScheduledTransactionsTable transactions={filteredScheduledTransactions} />
    </div>
  );
};

export default Analytics;