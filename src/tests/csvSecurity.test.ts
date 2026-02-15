import { describe, it, expect } from "vitest";
import { sanitizeCSVField } from "@/utils/csvUtils";

describe("sanitizeCSVField (Security)", () => {
  it("should escape strings starting with '='", () => {
    expect(sanitizeCSVField("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
  });

  it("should escape strings starting with '+'", () => {
    expect(sanitizeCSVField("+cmd")).toBe("'+cmd");
  });

  it("should escape strings starting with '-'", () => {
    expect(sanitizeCSVField("-cmd")).toBe("'-cmd");
  });

  it("should escape strings starting with '@'", () => {
    expect(sanitizeCSVField("@cmd")).toBe("'@cmd");
  });

  it("should NOT escape valid positive integers", () => {
    expect(sanitizeCSVField("123")).toBe("123");
    expect(sanitizeCSVField(123)).toBe("123");
  });

  it("should NOT escape valid negative integers", () => {
    expect(sanitizeCSVField("-123")).toBe("-123");
    expect(sanitizeCSVField(-123)).toBe("-123");
  });

  it("should NOT escape valid positive decimals", () => {
    expect(sanitizeCSVField("123.45")).toBe("123.45");
    expect(sanitizeCSVField(123.45)).toBe("123.45");
  });

  it("should NOT escape valid negative decimals", () => {
    expect(sanitizeCSVField("-123.45")).toBe("-123.45");
    expect(sanitizeCSVField(-123.45)).toBe("-123.45");
  });

  it("should NOT escape valid signed positive numbers", () => {
    expect(sanitizeCSVField("+123")).toBe("+123");
    expect(sanitizeCSVField("+123.45")).toBe("+123.45");
  });

  it("should NOT escape safe strings", () => {
    expect(sanitizeCSVField("Hello World")).toBe("Hello World");
    expect(sanitizeCSVField("Normal Text")).toBe("Normal Text");
  });

  it("should handle null and undefined", () => {
    expect(sanitizeCSVField(null)).toBe("");
    expect(sanitizeCSVField(undefined)).toBe("");
  });
});
