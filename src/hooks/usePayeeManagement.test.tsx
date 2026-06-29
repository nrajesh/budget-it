import * as React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePayeeManagement } from "./usePayeeManagement";

const ensurePayeeExists = vi.fn().mockResolvedValue("payee-id");
const invalidateAllData = vi.fn().mockResolvedValue(undefined);

vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => ({ ensurePayeeExists }),
}));

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({ invalidateAllData, deleteEntity: vi.fn() }),
}));

vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({ activeLedger: { id: "ledger-1" } }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/utils/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe("usePayeeManagement - CSV batch import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists each imported vendor via ensurePayeeExists", async () => {
    const { result } = renderHook(() => usePayeeManagement(false), { wrapper });

    await result.current.batchUpsertPayeesMutation.mutateAsync([
      { name: "Acme" },
      { name: "Globex" },
    ]);

    await waitFor(() => {
      expect(ensurePayeeExists).toHaveBeenCalledTimes(2);
    });
    expect(ensurePayeeExists).toHaveBeenCalledWith(
      "Acme",
      false,
      "ledger-1",
      expect.any(Object),
    );
    expect(ensurePayeeExists).toHaveBeenCalledWith(
      "Globex",
      false,
      "ledger-1",
      expect.any(Object),
    );
  });

  it("persists imported accounts with currency and starting balance", async () => {
    const { result } = renderHook(() => usePayeeManagement(true), { wrapper });

    await result.current.batchUpsertPayeesMutation.mutateAsync([
      {
        name: "Checking",
        currency: "EUR",
        starting_balance: 500,
        remarks: "Main",
      },
    ]);

    await waitFor(() => {
      expect(ensurePayeeExists).toHaveBeenCalledTimes(1);
    });
    expect(ensurePayeeExists).toHaveBeenCalledWith(
      "Checking",
      true,
      "ledger-1",
      expect.objectContaining({
        currency: "EUR",
        startingBalance: 500,
        remarks: "Main",
      }),
    );
  });
});
