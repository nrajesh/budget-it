
import { useMemo } from 'react';
import { Transaction } from '@/data/finance-data';

interface UseTransactionPairingResult {
    pairedTransactionIds: Set<string>;
}

export const useTransactionPairing = (transactions: Transaction[]): UseTransactionPairingResult => {
    return useMemo(() => {
        const pairedIds = new Set<string>();
        const usedIds = new Set<string>();

        // optimized grouping: date -> amount -> list of transactions
        // Inner key is string representation of absolute amount to 2 decimals
        const groups: Record<string, Record<string, Transaction[]>> = {};

        // 1. Group transactions by Date and Absolute Amount
        transactions.forEach(t => {
            // Normalize date: Use Local Date to match UI representation.
            // If we use UTC (split('T')[0]), transactions visually on the same day (Local) might be split (UTC).
            const d = new Date(t.date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;

            // Amount key: string with 2 decimals
            const amountKey = Math.abs(t.amount).toFixed(2);

            if (!groups[dateKey]) groups[dateKey] = {};
            if (!groups[dateKey][amountKey]) groups[dateKey][amountKey] = [];

            groups[dateKey][amountKey].push(t);
        });

        // 2. Iterate through groups to find pairs
        Object.keys(groups).forEach(dateKey => {
            Object.keys(groups[dateKey]).forEach(amountKeyStr => {
                const amountKeyVal = parseFloat(amountKeyStr);
                // Skip zero amounts
                if (amountKeyVal === 0) return;

                const candidates = groups[dateKey][amountKeyStr];
                if (candidates.length < 2) return;

                // Separate into credits (+) and debits (-)
                const credits = candidates.filter(t => t.amount > 0);
                const debits = candidates.filter(t => t.amount < 0);

                // Greedy matching
                credits.forEach(credit => {
                    if (usedIds.has(credit.id)) return;

                    let bestMatch: Transaction | null = null;
                    let bestScore = -1;

                    // Find best match among available debits
                    for (const debit of debits) {
                        if (usedIds.has(debit.id)) continue;

                        // Strict currency matching if present
                        // Update: User feedback indicates data might have wrong currency (e.g. USD vs EUR).
                        // We will relax this check to allow pairing of numerically identical amounts even if currency differs.
                        // if (credit.currency && debit.currency && credit.currency !== debit.currency) continue;

                        let score = 0;

                        // Same Category?
                        if (credit.category && debit.category && credit.category === debit.category) score += 1;

                        // Same Sub-Category? (User requested addition)
                        if (credit.sub_category && debit.sub_category && credit.sub_category === debit.sub_category) score += 1;

                        // Same Vendor?
                        if (credit.vendor && debit.vendor && credit.vendor === debit.vendor) score += 1;

                        // Same Remarks?
                        if (credit.remarks && debit.remarks && credit.remarks === debit.remarks) score += 1;

                        // If better score, take it
                        if (score > bestScore) {
                            bestScore = score;
                            bestMatch = debit;
                        }
                    }

                    if (bestMatch) {
                        // We found a pair!
                        pairedIds.add(credit.id);
                        pairedIds.add(bestMatch.id);
                        usedIds.add(credit.id);
                        usedIds.add(bestMatch.id);
                    }
                });
            });
        });

        return { pairedTransactionIds: pairedIds };
    }, [transactions]);
};
