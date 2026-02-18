import { Transaction } from "@/types/dataProvider";

/**
 * Creates a lookup map for real transactions to optimize deduplication.
 * Key: `${date}|${vendor}` (date is YYYY-MM-DD, vendor is lowercase trimmed)
 * Value: Array of transaction amounts
 *
 * Performance: O(N) where N is number of transactions.
 */
export function createTransactionLookup(transactions: Transaction[]): Map<string, number[]> {
  const lookup = new Map<string, number[]>();
  const len = transactions.length;
  for (let i = 0; i < len; i++) {
    const t = transactions[i];
    // Assuming t.date is ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
    // substring(0, 10) extracts YYYY-MM-DD faster than splitting or date parsing
    const tDate = t.date.length >= 10 ? t.date.substring(0, 10) : t.date;
    const tVendor = (t.vendor || "").toLowerCase().trim();
    const key = `${tDate}|${tVendor}`;

    const amounts = lookup.get(key);
    if (amounts) {
      amounts.push(t.amount);
    } else {
      lookup.set(key, [t.amount]);
    }
  }
  return lookup;
}

/**
 * Filters out projected transactions that match existing real transactions.
 * Matches are determined by Date, Vendor, and Amount (within epsilon).
 *
 * Performance: O(M) where M is number of projected transactions (assuming negligible collisions per key).
 *
 * @param projectedTransactions List of projected transactions
 * @param lookup Lookup map created by createTransactionLookup
 * @returns Filtered list of unique projected transactions
 */
export function deduplicateTransactions(
  projectedTransactions: Transaction[],
  lookup: Map<string, number[]>
): Transaction[] {
  return projectedTransactions.filter((p) => {
    const pDate = p.date.length >= 10 ? p.date.substring(0, 10) : p.date;
    const pVendor = (p.vendor || "").toLowerCase().trim();
    const key = `${pDate}|${pVendor}`;

    const realAmounts = lookup.get(key);
    if (!realAmounts) return true;

    // Check if any amount matches within small epsilon (0.01)
    // This handles floating point discrepancies
    for (const amt of realAmounts) {
        if (Math.abs(amt - p.amount) < 0.01) {
            return false; // Match found, filter out (it's a duplicate)
        }
    }
    return true; // No match, keep it
  });
}
