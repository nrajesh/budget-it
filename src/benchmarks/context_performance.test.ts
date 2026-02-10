import { describe, it, expect } from "vitest";
import { Transaction } from "@/data/finance-data";
import { Payee } from "@/components/dialogs/AddEditPayeeDialog";
import { calculateAccountStats } from "@/utils/accountUtils";

// Mock data structures
interface AccountDetails {
  id: string;
  currency: string;
  starting_balance: number;
  type: "Checking" | "Savings" | "Credit Card" | "Investment" | "Other";
  credit_limit?: number;
}

// Helper to generate mock data
const generateData = (transactionCount: number, accountCount: number) => {
  const accounts: Payee[] = [];
  const accountDetails: AccountDetails[] = [];
  const transactions: Transaction[] = [];

  for (let i = 0; i < accountCount; i++) {
    const id = `acc-${i}`;
    const name = `Account ${i}`;
    accounts.push({
      id,
      name,
      is_account: true,
      created_at: new Date().toISOString(),
      account_id: id,
      currency: "USD",
      starting_balance: 1000,
      remarks: "",
      running_balance: 0,
      totalTransactions: 0,
    });
    accountDetails.push({
      id,
      currency: "USD",
      starting_balance: 1000,
      type: "Checking",
    });
  }

  const today = new Date();
  for (let i = 0; i < transactionCount; i++) {
    const accIndex = i % accountCount;
    transactions.push({
      id: `tx-${i}`,
      date: today.toISOString(),
      account: `Account ${accIndex}`,
      currency: "USD",
      vendor: `Vendor ${i % 100}`,
      amount: i % 2 === 0 ? 100 : -50,
      category: "Food",
      created_at: today.toISOString(),
      user_id: "user-1",
    });
  }

  return { accounts, accountDetails, transactions };
};

describe("Context Performance Benchmark", () => {
  const { accounts, accountDetails, transactions } = generateData(10000, 50);
  const accountMap = new Map(accountDetails.map((a) => [a.id, a]));
  const nameToAccountMap = new Map<string, any>();
  accounts.forEach((v) => {
    nameToAccountMap.set(
      v.name.trim().toLowerCase(),
      accountMap.get(v.account_id!)!,
    );
  });

  const runBaseline = async () => {
    return await Promise.all(
      accounts.map(async (v) => {
        let accountDetails = v.account_id
          ? accountMap.get(v.account_id)
          : undefined;
        if (!accountDetails) {
          accountDetails = nameToAccountMap.get(v.name.trim().toLowerCase());
        }

        const startingBalance = accountDetails?.starting_balance || 0;
        const currency = accountDetails?.currency || "USD";
        const type = accountDetails?.type;
        const creditLimit = accountDetails?.credit_limit;

        const vNameNormalized = v.name.trim().toLowerCase();
        const now = new Date();
        const todayStr = now.toISOString().substring(0, 10);

        // Simple balance calculation
        const accountTransactions = transactions.filter(
          (t) =>
            (t.account || "").trim().toLowerCase() === vNameNormalized &&
            (t.date || "").substring(0, 10) <= todayStr,
        );
        const totalTransactionAmount = accountTransactions.reduce(
          (sum, t) => sum + t.amount,
          0,
        );
        const runningBalance = startingBalance + totalTransactionAmount;

        const count =
          accountTransactions.length +
          transactions.filter(
            (t) => t.vendor === v.name && t.account !== v.name,
          ).length;

        return {
          ...v,
          currency,
          total_transactions: count,
          starting_balance: startingBalance,
          running_balance: runningBalance,
          type: type,
          credit_limit: creditLimit,
        };
      }),
    );
  };

  const runOptimizedActual = async () => {
    const { balances, sourceCounts, vendorCounts } =
      calculateAccountStats(transactions);

    return await Promise.all(
      accounts.map(async (v) => {
        let accountDetails = v.account_id
          ? accountMap.get(v.account_id)
          : undefined;
        if (!accountDetails) {
          accountDetails = nameToAccountMap.get(v.name.trim().toLowerCase());
        }

        const startingBalance = accountDetails?.starting_balance || 0;
        const currency = accountDetails?.currency || "USD";
        const type = accountDetails?.type;
        const creditLimit = accountDetails?.credit_limit;

        const vNameNormalized = v.name.trim().toLowerCase();

        const totalTransactionAmount = balances.get(vNameNormalized) || 0;
        const runningBalance = startingBalance + totalTransactionAmount;

        const sourceCount = sourceCounts.get(vNameNormalized) || 0;
        const vendorCount = vendorCounts.get(v.name) || 0;
        const count = sourceCount + vendorCount;

        return {
          ...v,
          currency,
          total_transactions: count,
          starting_balance: startingBalance,
          running_balance: runningBalance,
          type: type,
          credit_limit: creditLimit,
        };
      }),
    );
  };

  it("should produce identical results", async () => {
    const baseline = await runBaseline();
    const optimized = await runOptimizedActual();

    expect(optimized.length).toBe(baseline.length);
    expect(optimized[0].running_balance).toBe(baseline[0].running_balance);
    expect(optimized[0].total_transactions).toBe(
      baseline[0].total_transactions,
    );
    expect(optimized).toEqual(baseline);
  });

  it("measures performance", async () => {
    const startBaseline = performance.now();
    await runBaseline();
    const endBaseline = performance.now();
    const baselineTime = endBaseline - startBaseline;

    const startOptimized = performance.now();
    await runOptimizedActual();
    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    console.log(`\nContext Calculation Performance (10k tx, 50 acc):`);
    console.log(`Baseline: ${baselineTime.toFixed(2)}ms`);
    console.log(`Optimized: ${optimizedTime.toFixed(2)}ms`);
    console.log(`Improvement: ${(baselineTime / optimizedTime).toFixed(2)}x\n`);

    expect(baselineTime).toBeGreaterThan(optimizedTime);
  });
});
