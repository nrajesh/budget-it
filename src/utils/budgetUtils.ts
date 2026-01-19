import { Budget, Transaction, Account, Vendor } from '@/types/dataProvider';
import { startOfMonth, endOfMonth, isWithinInterval, endOfDay, parseISO } from 'date-fns';

/**
 * Calculates the total spent amount for a specific budget based on its rules.
 * 
 * @param budget The budget to calculate spending for.
 * @param transactions List of ALL transactions (or at least those in the potential time range).
 * @param accounts List of all accounts (to resolve types).
 * @param vendors List of all vendors (to map transaction account names to account IDs).
 * @param convertCurrency Function to convert currency.
 * @param targetCurrency The currency to express the result in (usually budget.currency).
 */
export function calculateBudgetSpent(
    budget: Budget,
    transactions: Transaction[],
    accounts: Account[],
    vendors: Vendor[],
    convertCurrency: (amount: number, from: string, to: string) => number,
    targetCurrency: string
): number {
    // 1. Determine Time Range
    let startDate: Date;
    let endDate: Date;

    const now = new Date();
    const freq = budget.frequency as string; // Handle legacy/dirty data types freely

    // Handle different frequencies
    if (freq === 'Monthly' || freq === '1m' || !freq) { // Default to monthly
        // For Monthly, we strictly look at the current month to show "Budget vs Consumption" for THIS month.
        // Assuming the User wants to see how they are doing "Right Now".
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    } else if (freq === 'Yearly') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
    } else if (freq === 'Quarterly') {
        const currentMonth = now.getMonth();
        const startMonth = currentMonth - (currentMonth % 3);
        startDate = new Date(now.getFullYear(), startMonth, 1);
        endDate = new Date(now.getFullYear(), startMonth + 3, 0);
    } else {
        // One-time or custom range or "Once"
        startDate = parseISO(budget.start_date);
        endDate = budget.end_date ? parseISO(budget.end_date) : endOfDay(now);
    }

    // Optimize: Pre-calculate Account Type Map if valid account scope
    let allowedAccountTypes: Set<string> | null = null;
    const accountTypeMap = new Map<string, string>(); // Name -> Type

    if (budget.account_scope === 'GROUP' && budget.account_scope_values && budget.account_scope_values.length > 0) {
        allowedAccountTypes = new Set(budget.account_scope_values);

        // Build map
        vendors.filter(v => v.is_account).forEach(v => {
            if (v.account_id && v.name) {
                const acc = accounts.find(a => a.id === v.account_id);
                if (acc) {
                    accountTypeMap.set(v.name.trim().toLowerCase(), acc.type || 'Checking');
                }
            }
        });
    }

    // 2. Filter Transactions
    const relevantTransactions = transactions.filter(t => {
        // Date Check
        const txDate = new Date(t.date);
        // Safety check for invalid dates
        if (isNaN(txDate.getTime())) return false;

        if (!isWithinInterval(txDate, { start: startDate, end: endDate })) {
            return false;
        }

        // Category Check
        if (t.category !== budget.category_name) {
            return false;
        }

        // Sub-category Check (if specified in budget)
        if (budget.sub_category_name && t.sub_category !== budget.sub_category_name) {
            return false;
        }

        // Account Scope Check
        if (allowedAccountTypes) {
            const accountName = (t.account || '').trim().toLowerCase();
            const type = accountTypeMap.get(accountName);

            if (!type || !allowedAccountTypes.has(type)) {
                return false;
            }
        }

        return true;
    });

    // 3. Sum and Convert
    const totalSpent = relevantTransactions.reduce((sum, t) => {
        // Amount is negative for expense, positive for income.
        // We want "Spent" to be positive.
        // Subtract amount: - (-10) = +10. - (+10) = -10.
        const convertedAmount = convertCurrency(t.amount, t.currency, targetCurrency);
        return sum - convertedAmount;
    }, 0);

    return Math.max(0, totalSpent);
}
