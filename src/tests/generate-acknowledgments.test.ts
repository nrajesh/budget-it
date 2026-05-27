import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const SCRIPT = resolve(__dirname, "../../scripts/generate-acknowledgments.mjs");
const OUTPUT = resolve(__dirname, "../data/acknowledgments.generated.ts");

describe("generate-acknowledgments script", () => {
  beforeAll(() => {
    execSync(`node ${SCRIPT}`, { stdio: "inherit" });
  });

  it("writes a TypeScript module at the expected path", () => {
    expect(existsSync(OUTPUT)).toBe(true);
  });

  it("exports an array of Acknowledgment objects", async () => {
    const mod = await import("../data/acknowledgments.generated");
    expect(Array.isArray(mod.acknowledgments)).toBe(true);
    expect(mod.acknowledgments.length).toBeGreaterThan(10); // we have many deps
  });

  it("each entry has name, version, license, licenseText", async () => {
    const { acknowledgments } =
      await import("../data/acknowledgments.generated");
    for (const entry of acknowledgments) {
      expect(entry).toHaveProperty("name");
      expect(entry).toHaveProperty("version");
      expect(entry).toHaveProperty("license");
      expect(entry).toHaveProperty("licenseText");
      expect(typeof entry.name).toBe("string");
      expect(entry.name.length).toBeGreaterThan(0);
    }
  });

  it("entries are sorted alphabetically by name", async () => {
    const { acknowledgments } =
      await import("../data/acknowledgments.generated");
    const names = acknowledgments.map((a: { name: string }) => a.name);
    const sorted = [...names].sort((a: string, b: string) =>
      a.localeCompare(b),
    );
    expect(names).toEqual(sorted);
  });
});
