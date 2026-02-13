import { describe, it, expect } from "vitest";
import { projectScheduledTransactions } from "../utils/forecasting";
import { ScheduledTransaction } from "@/types/dataProvider";

describe("projectScheduledTransactions", () => {
  const baseTransaction: ScheduledTransaction = {
    id: "1",
    user_id: "user1",
    date: "2024-01-01T00:00:00.000Z",
    amount: 100,
    currency: "USD",
    account: "Checking",
    vendor: "Netflix",
    category: "Entertainment",
    sub_category: "Streaming",
    frequency: "Monthly",
    created_at: "2024-01-01T00:00:00.000Z",
  };

  it("should project monthly transactions correctly", () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-03-01");

    const result = projectScheduledTransactions(
      [baseTransaction],
      startDate,
      endDate,
    );

    expect(result).toHaveLength(3);
    expect(result[0].date).toContain("2024-01-01");
    expect(result[1].date).toContain("2024-02-01");
    expect(result[2].date).toContain("2024-03-01");
  });

  it("should handle custom frequency '2w' (bi-weekly)", () => {
    const transaction = { ...baseTransaction, frequency: "2w" };
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-02-01");

    const result = projectScheduledTransactions(
      [transaction],
      startDate,
      endDate,
    );

    // 2024-01-01, 2024-01-15, 2024-01-29
    expect(result).toHaveLength(3);
    expect(result[0].date).toContain("2024-01-01");
    expect(result[1].date).toContain("2024-01-15");
    expect(result[2].date).toContain("2024-01-29");
  });

  it("should respect recurrence end date", () => {
    const transaction = {
      ...baseTransaction,
      end_date: "2024-02-15T00:00:00.000Z",
    };
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-04-01");

    const result = projectScheduledTransactions(
      [transaction],
      startDate,
      endDate,
    );

    // 2024-01-01, 2024-02-01. 2024-03-01 is after end_date.
    expect(result).toHaveLength(2);
    expect(result[0].date).toContain("2024-01-01");
    expect(result[1].date).toContain("2024-02-01");
  });

  it("should handle 'Daily' frequency", () => {
    const transaction = { ...baseTransaction, frequency: "Daily" };
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-05");

    const result = projectScheduledTransactions(
      [transaction],
      startDate,
      endDate,
    );

    expect(result).toHaveLength(5);
  });

  it("should handle 'Weekly' frequency", () => {
    const transaction = { ...baseTransaction, frequency: "Weekly" };
    const startDate = new Date("2024-01-01"); // Monday
    const endDate = new Date("2024-01-15");

    const result = projectScheduledTransactions(
      [transaction],
      startDate,
      endDate,
    );

    // 01-01, 01-08, 01-15
    expect(result).toHaveLength(3);
  });
});
