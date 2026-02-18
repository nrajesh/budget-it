import { describe, it, expect } from "vitest";
import { Transaction } from "@/types/dataProvider";
import {
  createTransactionLookup,
  deduplicateTransactions,
} from "@/utils/transactionUtils";

// Helper to generate dummy transactions
function generateTransactions(count: number, startDate: Date): Transaction[] {
  const txs: Transaction[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (i % 365));
    txs.push({
      id: `t_${i}`,
      user_id: "u1",
      date: date.toISOString(),
      amount: (i % 100) + 10,
      currency: "USD",
      account: "Bank",
      vendor: `Vendor ${(i % 20)}`,
      category: "Cat",
      created_at: new Date().toISOString(),
    });
  }
  return txs;
}

// Old implementation for comparison (O(N*M))
function slowDedup(
  transactions: Transaction[],
  projectedTransactions: Transaction[],
) {
  return projectedTransactions.filter((p) => {
    const pDate = new Date(p.date).toISOString().split("T")[0];
    const pVendor = (p.vendor || "").toLowerCase().trim();
    const pAmount = p.amount;

    // Check if ANY real transaction matches
    const hasMatch = transactions.some((t) => {
      const tDate = new Date(t.date).toISOString().split("T")[0];
      const tVendor = (t.vendor || "").toLowerCase().trim();
      return (
        tDate === pDate &&
        Math.abs(t.amount - pAmount) < 0.01 &&
        tVendor === pVendor
      );
    });

    return !hasMatch;
  });
}

describe("Deduplication Benchmark", () => {
  /* eslint-disable no-console */
  it("compares slow vs fast deduplication", () => {
    // Setup data
    const realTxParams = { count: 5000, start: new Date("2024-01-01") };
    const projTxParams = { count: 1000, start: new Date("2024-01-01") }; // Overlapping dates

    const realTransactions = generateTransactions(
      realTxParams.count,
      realTxParams.start,
    );
    const projectedTransactions = generateTransactions(
      projTxParams.count,
      projTxParams.start,
    ).map((t) => ({
      ...t,
      id: `proj_${t.id}`,
      is_projected: true,
    }));

    // Ensure some overlap
    // The generation logic is deterministic so dates and vendors will align for same indices.

    // Measure Slow
    const startSlow = performance.now();
    const resultSlow = slowDedup(realTransactions, projectedTransactions);
    const endSlow = performance.now();
    const timeSlow = endSlow - startSlow;

    // Measure Fast
    const startFastSetup = performance.now();
    const lookup = createTransactionLookup(realTransactions);
    const startFastDedup = performance.now();
    const resultFast = deduplicateTransactions(projectedTransactions, lookup);
    const endFast = performance.now();

    const timeFastTotal = endFast - startFastSetup;
    const timeFastDedup = endFast - startFastDedup;

    console.log(`
      Transactions: ${realTransactions.length}
      Projected: ${projectedTransactions.length}
      Matches found (Slow): ${projectedTransactions.length - resultSlow.length}
      Matches found (Fast): ${projectedTransactions.length - resultFast.length}

      Slow Time: ${timeSlow.toFixed(2)}ms
      Fast Time (Total): ${timeFastTotal.toFixed(2)}ms
      Fast Time (Dedup Only): ${timeFastDedup.toFixed(2)}ms

      Speedup: ${(timeSlow / timeFastTotal).toFixed(1)}x
    `);

    expect(resultFast.length).toBe(resultSlow.length);
    // Basic verification of content? Not strictly needed for perf bench if lengths match for deterministic data.
  });
  /* eslint-enable no-console */
});
