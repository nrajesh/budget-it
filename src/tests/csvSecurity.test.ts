import { describe, it, expect } from "vitest";
import { sanitizeCSVField } from "../utils/csvUtils";

describe("sanitizeCSVField", () => {
  it("should return empty string for null or undefined", () => {
    expect(sanitizeCSVField(null)).toBe("");
    expect(sanitizeCSVField(undefined)).toBe("");
  });

  it("should not modify safe strings", () => {
    expect(sanitizeCSVField("Safe String")).toBe("Safe String");
    expect(sanitizeCSVField("12345")).toBe("12345");
    expect(sanitizeCSVField("User Name")).toBe("User Name");
  });

  it("should escape strings starting with =", () => {
    expect(sanitizeCSVField("=1+1")).toBe("'=1+1");
    expect(sanitizeCSVField("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
  });

  it("should NOT escape valid numeric strings starting with + or -", () => {
    expect(sanitizeCSVField("+123")).toBe("+123");
    expect(sanitizeCSVField("-123")).toBe("-123");
    expect(sanitizeCSVField("-10.50")).toBe("-10.50");
    expect(sanitizeCSVField("+0.05")).toBe("+0.05");
  });

  it("should escape non-numeric strings starting with + or -", () => {
    expect(sanitizeCSVField("+foo")).toBe("'+foo");
    expect(sanitizeCSVField("-foo")).toBe("'-foo");
    expect(sanitizeCSVField("+1+1")).toBe("'+1+1");
    expect(sanitizeCSVField("-1+1")).toBe("'-1+1");
    expect(sanitizeCSVField("--5")).toBe("'--5");
    expect(sanitizeCSVField("++5")).toBe("'++5");
  });

  it("should escape strings starting with @", () => {
    expect(sanitizeCSVField("@SUM(A1:A10)")).toBe("'@SUM(A1:A10)");
  });

  it("should escape strings starting with Tab", () => {
    expect(sanitizeCSVField("\tmalicious")).toBe("'\tmalicious");
  });

  it("should escape strings starting with Carriage Return", () => {
    expect(sanitizeCSVField("\rmalicious")).toBe("'\rmalicious");
  });

  it("should handle number types correctly (not escape negative numbers)", () => {
    expect(sanitizeCSVField(100)).toBe("100");
    expect(sanitizeCSVField(-100)).toBe("-100");
    expect(sanitizeCSVField(-10.55)).toBe("-10.55");
  });
});
