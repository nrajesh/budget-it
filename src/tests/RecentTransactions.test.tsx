import React from "react";
import { render, act } from "@testing-library/react";
import { RecentTransactions } from "@/components/RecentTransactions";
import { vi, describe, it, expect } from "vitest";
import { Transaction } from "@/types/dataProvider";
import { BrowserRouter } from "react-router-dom";

// Mock contexts
const mockTransactionsValue = {
  transactions: [] as Transaction[],
  accountCurrencyMap: new Map<string, string>(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts: [] as any[],
};

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => mockTransactionsValue,
}));

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    formatCurrency: (amount: number, currency: string) =>
      `${currency} ${amount}`,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Helper to generate transactions
const generateTransactions = (
  count: number,
  startDateStr: string,
): Transaction[] => {
  const transactions: Transaction[] = [];
  const startDate = new Date(startDateStr);

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i); // 1 transaction per day

    transactions.push({
      id: `txn-${i}`,
      user_id: "user1",
      date: date.toISOString(),
      amount: 100, // +100 per txn
      currency: "USD",
      account: "Test Account",
      vendor: "Vendor A",
      category: "Food",
      created_at: date.toISOString(),
    });
  }
  return transactions;
};

describe("RecentTransactions Performance", () => {
  it("benchmarks re-render with changing filters", async () => {
    // 1. Setup Large History (50,000 txns)
    const historySize = 50000;
    const history = generateTransactions(historySize, "2020-01-01").sort(
      () => Math.random() - 0.5,
    );

    // Set global context
    mockTransactionsValue.transactions = history;
    mockTransactionsValue.accounts = [
      { name: "Test Account", starting_balance: 0 },
    ];
    mockTransactionsValue.accountCurrencyMap.set("Test Account", "USD");

    // 2. Setup "Projected" extra transaction (future)
    // Ensure it is strictly after the history range (2020 + 50k days is ~2156, so use 3000)
    const projected = generateTransactions(1, "3000-01-01")[0];
    projected.id = "proj-1";
    projected.is_projected = true;

    // Initial render
    const initialProps = [...history.slice(0, 10), projected];

    const { rerender } = render(
      <BrowserRouter>
        <RecentTransactions
          transactions={initialProps}
          selectedCategories={[]}
        />
      </BrowserRouter>,
    );

    // 3. Measure Loop
    // We simulate changing the filtered view slightly, which passes a new array reference
    // containing the projected transaction.
    // This triggers "uniqueExtras" memo to re-run, returning a new array reference.
    // This triggers "balanceMap" to re-calculate O(History + Extras).

    const iterations = 50;
    const start = performance.now();

    await act(async () => {
      for (let i = 0; i < iterations; i++) {
        // Create a new array reference for props
        // We shift the window slightly to make sure it's "different" content too,
        // though reference change is enough to trigger the issue if not optimized.
        const subset = [...history.slice(i, i + 10), projected];

        rerender(
          <BrowserRouter>
            <RecentTransactions transactions={subset} selectedCategories={[]} />
          </BrowserRouter>,
        );
      }
    });

    const end = performance.now();
    console.log(
      `Benchmark Duration (${iterations} iterations): ${(end - start).toFixed(2)}ms`,
    );
    console.log(
      `Average per render: ${((end - start) / iterations).toFixed(2)}ms`,
    );

    // Simple assertion to ensure test ran
    expect(end).toBeGreaterThan(start);
  });

  it("correctly calculates balances for Fast Path (Future Extras)", () => {
    // History: 2 txns, total 200
    const history = generateTransactions(2, "2023-01-01");
    // txn-0: 2023-01-01, +100 -> bal 100
    // txn-1: 2023-01-02, +100 -> bal 200

    mockTransactionsValue.transactions = history;
    mockTransactionsValue.accounts = [
      { name: "Test Account", starting_balance: 0 },
    ];
    mockTransactionsValue.accountCurrencyMap.set("Test Account", "USD");

    // Extra: Future (2025)
    const future = generateTransactions(1, "2025-01-01")[0];
    future.id = "future-1";
    // bal should be 200 + 100 = 300

    const { container } = render(
      <BrowserRouter>
        <RecentTransactions
          transactions={[...history, future]}
          selectedCategories={[]}
        />
      </BrowserRouter>,
    );

    // We expect to see 3 rows in Descending order.
    // Row 1: Future (300)
    // Row 2: txn-1 (200)
    // Row 3: txn-0 (100)

    const cells = container.querySelectorAll("tbody tr td:last-child");
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveTextContent("USD 300");
    expect(cells[1]).toHaveTextContent("USD 200");
    expect(cells[2]).toHaveTextContent("USD 100");
  });

  it("correctly calculates balances for Slow Path (Interleaved Extras)", () => {
    // History: 2 txns (Jan 1, Jan 3)
    const history = generateTransactions(2, "2023-01-01");
    history[1].date = "2023-01-03T00:00:00.000Z"; // Change date of second txn

    // txn-0: Jan 1, +100 -> bal 100
    // txn-1: Jan 3, +100 -> bal 300 (if interleaved is counted)

    mockTransactionsValue.transactions = history;
    mockTransactionsValue.accounts = [
      { name: "Test Account", starting_balance: 0 },
    ];
    mockTransactionsValue.accountCurrencyMap.set("Test Account", "USD");

    // Extra: Interleaved (Jan 2)
    const interleaved = generateTransactions(1, "2023-01-02")[0];
    interleaved.id = "inter-1";

    // Expected Order (Desc):
    // 1. txn-1 (Jan 3): Bal 300 (100+100+100)
    // 2. inter-1 (Jan 2): Bal 200 (100+100)
    // 3. txn-0 (Jan 1): Bal 100

    const { container } = render(
      <BrowserRouter>
        <RecentTransactions
          transactions={[...history, interleaved]}
          selectedCategories={[]}
        />
      </BrowserRouter>,
    );

    const cells = container.querySelectorAll("tbody tr td:last-child");
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveTextContent("USD 300"); // txn-1
    expect(cells[1]).toHaveTextContent("USD 200"); // inter-1
    expect(cells[2]).toHaveTextContent("USD 100"); // txn-0
  });
});
