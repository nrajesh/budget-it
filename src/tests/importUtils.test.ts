import { describe, it, expect } from "vitest";
import { parseRobustFrequency } from "../utils/importUtils";

describe("parseRobustFrequency", () => {
  it("should return null for empty or null input", () => {
    expect(parseRobustFrequency(null)).toBeNull();
    expect(parseRobustFrequency(undefined)).toBeNull();
    expect(parseRobustFrequency("")).toBeNull();
    expect(parseRobustFrequency("   ")).toBeNull();
  });

  it("should return null for 'None'", () => {
    expect(parseRobustFrequency("None")).toBeNull();
    expect(parseRobustFrequency("none")).toBeNull();
    expect(parseRobustFrequency("  NONE  ")).toBeNull();
  });

  it("should normalize named frequencies", () => {
    expect(parseRobustFrequency("daily")).toBe("Daily");
    expect(parseRobustFrequency("Daily")).toBe("Daily");
    expect(parseRobustFrequency("  DAILY  ")).toBe("Daily");

    expect(parseRobustFrequency("weekly")).toBe("Weekly");
    expect(parseRobustFrequency("monthly")).toBe("Monthly");
    expect(parseRobustFrequency("quarterly")).toBe("Quarterly");
    expect(parseRobustFrequency("yearly")).toBe("Yearly");
  });

  it("should handle Fortnightly specifically", () => {
    expect(parseRobustFrequency("fortnightly")).toBe("Fortnightly");
    expect(parseRobustFrequency("fortnight")).toBe("Fortnightly");
    expect(parseRobustFrequency("bi-weekly")).toBe("Fortnightly");
    expect(parseRobustFrequency("biweekly")).toBe("Fortnightly");
    expect(parseRobustFrequency("Bi-Weekly")).toBe("Fortnightly");
    expect(parseRobustFrequency("Fortnightly")).toBe("Fortnightly");
  });

  it("should validate and return unit format frequencies", () => {
    expect(parseRobustFrequency("1d")).toBe("1d");
    expect(parseRobustFrequency("2w")).toBe("2w");
    expect(parseRobustFrequency("3m")).toBe("3m");
    expect(parseRobustFrequency("1y")).toBe("1y");
    expect(parseRobustFrequency("12m")).toBe("12m");
    expect(parseRobustFrequency("  6m  ")).toBe("6m");
  });

  it("should return null for invalid frequencies", () => {
    expect(parseRobustFrequency("invalid")).toBeNull();
    expect(parseRobustFrequency("123")).toBeNull();
    expect(parseRobustFrequency("d1")).toBeNull();
    expect(parseRobustFrequency("1x")).toBeNull();
    expect(parseRobustFrequency("monthly ")).not.toBeNull(); // Should handle trim
    expect(parseRobustFrequency("every day")).toBeNull();
  });
});
