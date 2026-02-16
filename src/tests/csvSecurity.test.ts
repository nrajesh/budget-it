import { describe, it, expect } from "vitest";
import { sanitizeCSVField } from "../utils/csvUtils";

describe("CSV Security", () => {
  describe("sanitizeCSVField", () => {
    it("should escape strings starting with =", () => {
      expect(sanitizeCSVField("=cmd|/C calc!A0")).toBe("'=cmd|/C calc!A0");
    });

    it("should escape strings starting with +", () => {
      expect(sanitizeCSVField("+cmd|/C calc!A0")).toBe("'+cmd|/C calc!A0");
    });

    it("should escape strings starting with - (if not a number)", () => {
      expect(sanitizeCSVField("-cmd|/C calc!A0")).toBe("'-cmd|/C calc!A0");
    });

    it("should escape strings starting with @", () => {
      expect(sanitizeCSVField("@cmd|/C calc!A0")).toBe("'@cmd|/C calc!A0");
    });

    it("should NOT escape valid positive integers", () => {
      expect(sanitizeCSVField("123")).toBe("123");
      expect(sanitizeCSVField(123)).toBe("123");
    });

    it("should NOT escape valid negative integers", () => {
      expect(sanitizeCSVField("-123")).toBe("-123");
      expect(sanitizeCSVField(-123)).toBe("-123");
    });

    it("should NOT escape valid positive floats", () => {
      expect(sanitizeCSVField("123.45")).toBe("123.45");
      expect(sanitizeCSVField(123.45)).toBe("123.45");
    });

    it("should NOT escape valid negative floats", () => {
      expect(sanitizeCSVField("-123.45")).toBe("-123.45");
      expect(sanitizeCSVField(-123.45)).toBe("-123.45");
    });

    it("should NOT escape safe strings", () => {
      expect(sanitizeCSVField("Safe String")).toBe("Safe String");
    });

    it("should handle null and undefined", () => {
      expect(sanitizeCSVField(null)).toBe("");
      expect(sanitizeCSVField(undefined)).toBe("");
    });

    it("should handle boolean values", () => {
      expect(sanitizeCSVField(true)).toBe("true");
      expect(sanitizeCSVField(false)).toBe("false");
    });
  });
});
