import React from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { useTransactions } from '@/contexts/TransactionsContext';
import { slugify } from '@/lib/utils';

export const useDefaultAccountSelection = (options: { autoRun?: boolean } = {}) => {
    const { autoRun = true } = options;
    const { selectedAccounts, setSelectedAccounts, dateRange } = useFilter();
    const {
        transactions: allTransactions,
        isLoadingTransactions,
        accounts: allAccounts,
        isLoadingAccounts
    } = useTransactions();

    // Track previous transaction count to detect imports/updates
    const prevTxLength = React.useRef(0);

    const selectDefaultAccounts = React.useCallback(() => {
        if (isLoadingTransactions || isLoadingAccounts) return;

        const newSelection = new Set<string>();

        // Helper to add accounts to selection up to limit
        const addAccounts = (candidates: string[]) => {
            for (const acc of candidates) {
                if (newSelection.size >= 4) break;
                newSelection.add(acc);
            }
        };

        // Strategy 1: Top active accounts in current date range
        if (dateRange?.from && dateRange?.to && allTransactions.length > 0) {
            const rangeTransactions = allTransactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= dateRange.from! && tDate <= dateRange.to!;
            });

            const accountCounts: Record<string, number> = {};
            rangeTransactions.forEach(t => {
                if (t.account) {
                    accountCounts[t.account] = (accountCounts[t.account] || 0) + 1;
                }
            });

            const sortedByRange = Object.entries(accountCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([account]) => slugify(account));

            addAccounts(sortedByRange);
        }

        // Strategy 2: If < 4, Top active accounts overall (All Time)
        if (newSelection.size < 4 && allTransactions.length > 0) {
            const accountCounts: Record<string, number> = {};
            allTransactions.forEach(t => {
                if (t.account) {
                    accountCounts[t.account] = (accountCounts[t.account] || 0) + 1;
                }
            });

            const sortedByAllTime = Object.entries(accountCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([account]) => slugify(account));

            addAccounts(sortedByAllTime);
        }

        // Strategy 3: If < 4, Alphabetical from all available accounts
        if (newSelection.size < 4 && allAccounts.length > 0) {
            // allAccounts is already sorted by name usually, but ensure it
            const sortedAlphabetical = [...allAccounts]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(a => slugify(a.name));

            addAccounts(sortedAlphabetical);
        }

        const selectionArray = Array.from(newSelection);
        if (selectionArray.length > 0) {
            // Log removed
            setSelectedAccounts(selectionArray);
        }
    }, [allTransactions, allAccounts, isLoadingTransactions, isLoadingAccounts, dateRange, setSelectedAccounts]);

    // Cleanup effect to track transaction length changes
    React.useEffect(() => {
        if (!autoRun) return;

        const currentLength = allTransactions.length;
        const hasData = currentLength > 0 || allAccounts.length > 0;
        const isDataReady = !isLoadingTransactions && !isLoadingAccounts;
        const noSelection = selectedAccounts.length === 0;
        const dataChanged = currentLength !== prevTxLength.current;

        // Run selection if:
        // 1. Data is ready
        // 2. No accounts are currently selected
        // 3. AND (Data just changed OR it's the first run with data)
        // We check prevTxLength to detect changes (imports).
        // We checks hasData to ensure we don't run on empty state needlessly (though alphabetical strategy might want to run if accounts exist but no transactions? Yes.)

        if (isDataReady && noSelection && hasData) {
            // Log removed
            // If data changed, OR if we haven't selected anything yet (maybe first load), try selecting.
            // Using dataChanged helps avoid overriding manual clear, BUT:
            // If I start app, data loads (0 -> N), dataChanged=true. Select defaults. OK.
            // If I clear selection, selectedAccounts=0. dataChanged=false. No re-select. OK.
            // If I import data, data loads (N -> M), dataChanged=true. Select defaults. OK.
            if (dataChanged || prevTxLength.current === 0) {
                selectDefaultAccounts();
            }
        }

        // Update ref
        prevTxLength.current = currentLength;

    }, [
        autoRun,
        isLoadingTransactions,
        isLoadingAccounts,
        allTransactions.length,
        allAccounts.length,
        selectedAccounts.length,
        selectDefaultAccounts
    ]);

    return { selectDefaultAccounts };
};
