import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Capacitor before any imports that use it
vi.mock("@capacitor/core", async () => {
  const actual =
    await vi.importActual<typeof import("@capacitor/core")>("@capacitor/core");
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, isNativePlatform: vi.fn() },
  };
});

// Mock heavy providers to avoid Dexie/IndexedDB issues in test
vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    selectedCurrency: "EUR",
    setCurrency: vi.fn(),
    availableCurrencies: [],
  }),
}));
vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({
    activeLedger: null,
    updateLedgerDetails: vi.fn(),
  }),
  LedgerProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/hooks/useSyncConfig", () => ({
  useSyncConfig: () => ({
    syncEnabled: false,
    needsPermission: false,
    requestPermission: vi.fn(),
    config: {
      autoSyncEnabled: false,
      syncFolderPath: "",
    },
    toggleAutoSync: vi.fn(),
    setSyncFolder: vi.fn(),
  }),
}));
vi.mock("@/hooks/useAIConfig", () => ({
  useAIConfig: () => ({
    config: { provider: null },
    saveConfig: vi.fn(),
    refreshConfig: vi.fn(),
  }),
}));
vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => ({
    getAIProviders: vi.fn().mockResolvedValue([]),
  }),
}));

import React from "react";
import { Capacitor } from "@capacitor/core";

describe("DonationPage hiding on native platforms (FR-021)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides the Support Development link when Capacitor.isNativePlatform() is true", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(
      true,
    );
    const { render, screen } = await import("@testing-library/react");
    const { MemoryRouter } = await import("react-router-dom");
    const SettingsPage = (await import("@/pages/SettingsPage")).default;
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("link", { name: /support development|donate/i }),
    ).toBeNull();
  });

  it("shows the Support Development link when not native", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(
      false,
    );
    const { render, screen } = await import("@testing-library/react");
    const { MemoryRouter } = await import("react-router-dom");
    const SettingsPage = (await import("@/pages/SettingsPage")).default;
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );
    // At least one link to /donate should exist
    const links = screen.getAllByRole("link", {
      name: /support development/i,
    });
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});
