import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { LedgerProvider, useLedger } from "./LedgerContext";

const mockSetCurrency = vi.fn();
const mockNavigateAppPath = vi.fn();

const testLedger = {
  id: "ledger-1",
  name: "Household",
  currency: "EUR",
  icon: "wallet",
  short_name: "Home",
  created_at: "2026-01-01T00:00:00.000Z",
  last_accessed: "2026-01-01T00:00:00.000Z",
};

let resolveUpdateLedger: (() => void) | null = null;

const mockDataProvider = {
  getLedgers: vi.fn().mockResolvedValue([testLedger]),
  updateLedger: vi.fn(
    () =>
      new Promise<void>((resolve) => {
        resolveUpdateLedger = resolve;
      }),
  ),
  addLedger: vi.fn(),
  deleteLedger: vi.fn(),
};

vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => mockDataProvider,
}));

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    setCurrency: mockSetCurrency,
  }),
}));

vi.mock("@/utils/navigation", () => ({
  navigateAppPath: (path: string) => mockNavigateAppPath(path),
}));

const TestConsumer = () => {
  const { isLoading, switchLedger } = useLedger();

  return (
    <>
      <div data-testid="loading-state">{isLoading ? "loading" : "idle"}</div>
      <button onClick={() => switchLedger(testLedger.id, testLedger)}>
        switch
      </button>
    </>
  );
};

describe("LedgerProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataProvider.getLedgers.mockResolvedValue([testLedger]);
    mockDataProvider.updateLedger.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdateLedger = resolve;
        }),
    );
    resolveUpdateLedger = null;
    localStorage.clear();
  });

  it("keeps isLoading true while a ledger switch is in flight", async () => {
    render(
      <LedgerProvider>
        <TestConsumer />
      </LedgerProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle");
    });

    fireEvent.click(screen.getByText("switch"));

    await waitFor(() => {
      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });

    expect(localStorage.getItem("activeLedgerId")).toBe(testLedger.id);
    expect(mockDataProvider.updateLedger).toHaveBeenCalledWith(
      expect.objectContaining({
        id: testLedger.id,
        last_accessed: expect.any(String),
      }),
    );

    await act(async () => {
      resolveUpdateLedger?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle");
    });

    expect(mockSetCurrency).toHaveBeenCalledWith("EUR");
    expect(localStorage.getItem("selectedCurrency")).toBe("EUR");
    expect(mockNavigateAppPath).toHaveBeenCalledWith("/dashboard");
  });
});
