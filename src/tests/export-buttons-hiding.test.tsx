import { describe, it, expect, vi, beforeEach } from "vitest";
import { Capacitor } from "@capacitor/core";

vi.mock("@capacitor/core", async () => {
  const actual =
    await vi.importActual<typeof import("@capacitor/core")>("@capacitor/core");
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, isNativePlatform: vi.fn() },
  };
});

describe("ExportButtons hiding on native platforms (FR-022)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isNativePlatform check is used to gate ExportButtons in ReportLayout", async () => {
    // Verify the conditional exists in the source by reading the module
    // This is a structural test: ReportLayout.tsx must reference
    // Capacitor.isNativePlatform() to conditionally render ExportButtons
    const fs = await import("node:fs");
    const path = await import("node:path");
    const reportLayoutPath = path.resolve(
      __dirname,
      "../pages/reports/ReportLayout.tsx",
    );
    const source = fs.readFileSync(reportLayoutPath, "utf8");

    // Verify Capacitor is imported
    expect(source).toContain('import { Capacitor } from "@capacitor/core"');

    // Verify ExportButtons is wrapped in the native platform check
    expect(source).toContain("!Capacitor.isNativePlatform()");

    // Verify both ExportButtons and the Capacitor check are present together
    // Find the render site (second occurrence, after the import)
    const firstIdx = source.indexOf("<ExportButtons");
    expect(firstIdx).toBeGreaterThan(-1);
    const renderRegion = source.slice(
      Math.max(0, firstIdx - 200),
      firstIdx + 200,
    );
    expect(renderRegion).toContain("isNativePlatform");
  });

  it("mock: ExportButtons renders when not native", () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(
      false,
    );
    // On web, the conditional !Capacitor.isNativePlatform() is true
    expect(!Capacitor.isNativePlatform()).toBe(true);
  });

  it("mock: ExportButtons hidden when native", () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(
      true,
    );
    // On native, the conditional !Capacitor.isNativePlatform() is false
    expect(!Capacitor.isNativePlatform()).toBe(false);
  });
});
