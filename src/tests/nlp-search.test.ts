import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { parseSearchQuery } from "../utils/nlp-search";

describe("parseSearchQuery", () => {
  beforeEach(() => {
    // Mock the date to a fixed point in time: 2023-10-10 12:00:00
    vi.useFakeTimers();
    const date = new Date(2023, 9, 10, 12, 0, 0); // Month is 0-indexed, so 9 is October
    vi.setSystemTime(date);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should correctly parse "today" query', () => {
    const query = "today";
    const result = parseSearchQuery(query);

    expect(result.dateRange).toBeDefined();

    const expectedStart = new Date(2023, 9, 10, 0, 0, 0, 0);
    const expectedEnd = new Date(2023, 9, 10, 23, 59, 59, 999);

    expect(result.dateRange?.from).toEqual(expectedStart);
    expect(result.dateRange?.to).toEqual(expectedEnd);
  });
  it('should treat "all time" as no date filter', () => {
    const query = "groceries all time";
    const result = parseSearchQuery(query);

    // Should not have a date range
    expect(result.dateRange).toBeUndefined();

    // Should have text "groceries"
    expect(result.text).toContain("groceries");

    // Should NOT have "all" or "time" in text
    expect(result.text).not.toContain("all");
    expect(result.text).not.toContain("time");
  });

  it('should treat independent "all time" as no date filter', () => {
    const query = "all time";
    const result = parseSearchQuery(query);

    expect(result.dateRange).toBeUndefined();
    expect(result.text).toEqual([]);
  });
});
