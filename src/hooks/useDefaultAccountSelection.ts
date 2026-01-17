import React from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { useTransactions } from '@/contexts/TransactionsContext';

export const useDefaultAccountSelection = (options: { autoRun?: boolean } = {}) => {
    const { autoRun = true } = options;
    const { selectedAccounts, setSelectedAccounts, dateRange } = useFilter();
    const { transactions: allTransactions, isLoadingTransactions } = useTransactions();
    const hasSetDefaultAccounts = React.useRef(false);

    const selectDefaultAccounts = React.useCallback(() => {
        if (
            !isLoadingTransactions &&
            allTransactions.length > 0
        ) {
            // 1. Filter transactions by current date range (if set, otherwise use all)
            let candidateTransactions = allTransactions;
            if (dateRange?.from && dateRange?.to) {
                candidateTransactions = allTransactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate >= dateRange.from! && tDate <= dateRange.to!;
                });
            }

            // 2. Group by account and count
            const accountCounts: Record<string, number> = {};
            candidateTransactions.forEach(t => {
                if (t.account) {
                    accountCounts[t.account] = (accountCounts[t.account] || 0) + 1;
                }
            });

            // 3. Sort by count desc
            const sortedAccounts = Object.entries(accountCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([account]) => account);

            // 4. Take top 4
            const top4 = sortedAccounts.slice(0, 4);

            if (top4.length > 0) {
                console.log("Setting default accounts:", top4);
                setSelectedAccounts(top4);
            }
        }
    }, [allTransactions, isLoadingTransactions, dateRange, setSelectedAccounts]);

    // Run once on mount if no accounts selected
    React.useEffect(() => {
        if (
            autoRun &&
            !isLoadingTransactions &&
            allTransactions.length > 0 &&
            selectedAccounts.length === 0 &&
            !hasSetDefaultAccounts.current
        ) {
            selectDefaultAccounts();
            hasSetDefaultAccounts.current = true;
        }
    }, [autoRun, isLoadingTransactions, allTransactions.length, selectDefaultAccounts, selectedAccounts.length]);

    return { selectDefaultAccounts };
};
