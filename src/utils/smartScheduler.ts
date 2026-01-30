import { Transaction, ScheduledTransaction } from "@/types/dataProvider";
import { subYears, getDate, differenceInDays } from "date-fns";
import { v4 as uuidv4 } from 'uuid';

export const detectRecurringPatterns = (
    transactions: Transaction[],
    existingScheduled: ScheduledTransaction[]
): ScheduledTransaction[] => {
    // 1. Filter: Look back 1 year
    const oneYearAgo = subYears(new Date(), 1);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= oneYearAgo);

    // 2. Group by "Signature" (Vendor + Category + SubCategory + Account)
    // We strictly match account too as per request ("same combination of vendor/ category/ sub-category/ account")
    const groups = new Map<string, Transaction[]>();

    recentTransactions.forEach(t => {
        // Skip transfers or irregular things if desired?
        // User didn't specify excluding irregulars strictly, but pattern detection will filter them.

        // Primary Key Construction
        // We exclude Amount from key to allow for varying payments.
        // We include Notes to distinguish distinct subscriptions if they are labeled differently.
        const key = [
            t.vendor?.trim(),
            t.category?.trim(),
            t.sub_category?.trim() || '',
            t.account?.trim(),
            (t.remarks || '').trim()
        ].join('||');

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(t);
    });

    const suggestions: ScheduledTransaction[] = [];
    const today = new Date();

    // 3. Analyze each group
    groups.forEach((groupTransactions, key) => {
        // Must have sufficient history (e.g. at least 3 occurrences)
        if (groupTransactions.length < 3) return;

        // Sort by date asc
        groupTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Check for duplicate in existing scheduled
        // Key now includes amount/notes, so splitting is key.
        const [vendor, category, subCategory, account] = key.split('||');

        // Skip "Unknown" vendors
        if (!vendor || vendor.toLowerCase() === 'unknown') return;

        const exists = existingScheduled.some(s =>
            (s.vendor || '').toLowerCase() === (vendor || '').toLowerCase() &&
            (s.account || '').toLowerCase() === (account || '').toLowerCase() &&
            (s.category || '').toLowerCase() === (category || '').toLowerCase()
            // We don't check amount strictly anymore to avoid missing variable bills
        );

        if (exists) return;

        // Analyze Intervals (skip 0-day dupes)
        const dates = groupTransactions.map(t => new Date(t.date));
        const intervals: number[] = [];
        for (let i = 1; i < dates.length; i++) {
            const diff = differenceInDays(dates[i], dates[i - 1]);
            if (diff > 0) {
                intervals.push(diff);
            }
        }

        if (intervals.length === 0) return;

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        let frequency: ScheduledTransaction['frequency'] | null = null;

        // Prioritize Monthly detection with generous variance
        if (Math.abs(avgInterval - 30.44) < 12) {
            frequency = 'Monthly';
        } else if (Math.abs(avgInterval - 7) < 3) {
            frequency = 'Weekly';
        } else if (Math.abs(avgInterval - 365) < 30) {
            frequency = 'Yearly'; // Explicit Yearly check just in case
        }

        if (!frequency) return;

        // Determine Baseline Date & Amount Stats
        const daysOfMonth = dates.map(d => getDate(d));
        const dayCounts = new Map<number, number>();
        daysOfMonth.forEach(d => dayCounts.set(d, (dayCounts.get(d) || 0) + 1));

        // Mode of Day
        let baselineDay = daysOfMonth[0];
        let maxCount = 0;
        dayCounts.forEach((count, day) => {
            if (count > maxCount) { maxCount = count; baselineDay = day; }
        });

        // Amount Analysis
        const totalAmount = groupTransactions.reduce((sum, t) => sum + t.amount, 0);
        const avgAmount = totalAmount / groupTransactions.length;
        const variance = groupTransactions.reduce((sum, t) => sum + Math.pow(t.amount - avgAmount, 2), 0) / groupTransactions.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / Math.abs(avgAmount);

        // --- Category-Specific Logic ---

        const catLower = category.toLowerCase();

        // 1. High Trust Categories (Investments, Housing, Bills, Income)
        // Allow high variance because these overlap with user's "varying payments" request
        const isHighTrust =
            catLower.includes('investment') ||
            catLower.includes('financial') ||
            catLower.includes('bill') ||
            catLower.includes('utility') ||
            catLower.includes('rent') ||
            catLower.includes('mortgage') ||
            catLower.includes('income') ||
            catLower.includes('transfer'); // Sometimes transfers are scheduled

        if (isHighTrust) {
            // Very relaxed variance. 
            // If they are regular (Monthly), they are likely valid even if amounts vary wildly.
        }

        // 2. Low Trust Categories (Shopping, Groceries, Dining)
        // These are usually noise. Only schedule if they are VERY consistent (Subscription-like).
        else if (catLower.includes('shop') || catLower.includes('food') || catLower.includes('grocery') || catLower.includes('dining')) {
            // Strict variance check.
            if (cv > 0.05) return; // Must be within 5% consistency

            // Also maybe require tighter interval adherence?
            // "Matthijs Boon" -6 weekly. Consistency is perfect (-6, -6, -6). But it's grocery.
            // If it's effectively a subscription (e.g. coffee sub), allow it.
            // But if user hates it, maybe user needs to blacklist manually?
            // User complained about "Grocery item on repeat". 
            // If it's weekly and fixed amount, it's technically a pattern.
            // But let's assume valid grocery patterns are rare compared to noise.

            // OPTIONAL: Heuristic - if amount is very small and weekly, might be duplicate/noise?
        }

        // 3. General Categories (Software, Entertainment, everything else)
        else {
            // Standard check
            if (cv > 0.2) return; // 20% variance allowance
        }

        // No need for variance check as we grouped by amount.
        // Exception: Random matches of same amount/notes? rare.

        // Construct Scheduled Transaction
        // Next occurrence: Next month on baselineDay?
        // Need to find the *next* valid date after today.

        let nextDate = new Date(today.getFullYear(), today.getMonth(), baselineDay);
        // If today is past this month's baseline, move to next month
        if (nextDate <= today) {
            nextDate = new Date(today.getFullYear(), today.getMonth() + 1, baselineDay);
        }

        // Handle edges (e.g. 31st in a 30-day month) - Date constructor handles overflow (Feb 30 -> Mar 2), but maybe we want "Last day"?
        // For simplicity, native overflow is usually acceptable or we clamp.
        // Prompt says "tentative date of recurrance as 15th of next month".

        // Use latest amount instead of average as per user request
        const latestTransaction = groupTransactions[groupTransactions.length - 1];
        const latestAmount = latestTransaction.amount;

        // Create Suggestion
        suggestions.push({
            id: `suggested-${uuidv4()}`, // Temporary ID
            user_id: groupTransactions[0].user_id,
            account,
            vendor,
            category,
            sub_category: subCategory || null,
            amount: latestAmount,
            currency: groupTransactions[0].currency,
            date: nextDate.toISOString(),
            frequency,
            created_at: new Date().toISOString()
        });

    });

    return suggestions;
};
