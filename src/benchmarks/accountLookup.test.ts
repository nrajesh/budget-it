import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils";

describe("Account Lookup Performance Benchmark", () => {
  const ACCOUNT_COUNT = 1000;
  const SELECTED_COUNT = 500;

  const accounts = Array.from({ length: ACCOUNT_COUNT }).map((_, i) => ({
    name: `Account ${i}`,
    id: `acc-${i}`,
    type: "Bank",
    balance: 1000,
  }));

  const selectedAccounts = Array.from({ length: SELECTED_COUNT }).map(
    (_, i) => slugify(accounts[(i * 2) % ACCOUNT_COUNT].name), // Select every other account
  );

  it("Baseline: Array.find Lookup", () => {
    const start = performance.now();

    const accountText =
      selectedAccounts.length > 0
        ? `Accounts: ${selectedAccounts.map((slug) => accounts.find((a: any) => slugify(a.name) === slug)?.name || slug).join(", ")}`
        : "All Accounts";

    const end = performance.now();
    const duration = end - start;

    // We just need to make sure it runs and returns something to prevent optimization removal
    expect(accountText).toContain("Account");
    console.log(
      `\n\n[Baseline] Array.find Lookup (${ACCOUNT_COUNT} accounts, ${SELECTED_COUNT} selected): ${duration.toFixed(4)}ms\n\n`,
    );
  });

  it("Optimized: Map Lookup", () => {
    // Include Map creation time in the benchmark as it is part of the cost if done in render/memo
    const start = performance.now();

    const accountNameMap = new Map(
      accounts.map((a: any) => [slugify(a.name), a.name]),
    );

    const accountText =
      selectedAccounts.length > 0
        ? `Accounts: ${selectedAccounts.map((slug) => accountNameMap.get(slug) || slug).join(", ")}`
        : "All Accounts";

    const end = performance.now();
    const duration = end - start;

    expect(accountText).toContain("Account");
    console.log(
      `\n\n[Optimized] Map Lookup (${ACCOUNT_COUNT} accounts, ${SELECTED_COUNT} selected): ${duration.toFixed(4)}ms\n\n`,
    );
  });
});
