import { describe, it, expect } from "vitest";
import { projectScheduledTransactions } from "../utils/forecasting";
import { ScheduledTransaction } from "../types/dataProvider";

describe("performance repro", () => {
  it("measures projection time", () => {
    const st: ScheduledTransaction = {
      id: "1",
      user_id: "u1",
      date: "2010-01-01T00:00:00Z",
      frequency: "Daily",
      amount: 100,
      currency: "USD",
      account: "Bank",
      vendor: "Vendor",
      category: "Cat",
      sub_category: "Sub",
      created_at: "2010-01-01T00:00:00Z",
    };

    const windowStart = new Date("2024-01-01T00:00:00Z");
    const windowEnd = new Date("2024-12-31T00:00:00Z");

    // Verify correctness first
    const result = projectScheduledTransactions([st], windowStart, windowEnd);
    // 2024 is a leap year, so 366 days
    expect(result.length).toBe(366);
    expect(result[0].date).toContain("2024-01-01");
    expect(result[result.length - 1].date).toContain("2024-12-31");

    const start = performance.now();
    // Run 1000 times to amplify the effect
    for (let i = 0; i < 1000; i++) {
      projectScheduledTransactions([st], windowStart, windowEnd);
    }
    const end = performance.now();

    console.log(
      `Projection time for 1000 iterations: ${(end - start).toFixed(2)}ms`,
    );
  });
});
