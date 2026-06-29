import * as React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCategoryManagement } from "./useCategoryManagement";

const ensureCategoryExists = vi.fn().mockResolvedValue("cat-id");
const refetchCategories = vi.fn().mockResolvedValue(undefined);
const invalidateAllData = vi.fn().mockResolvedValue(undefined);

vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => ({
    ensureCategoryExists,
    ensureSubCategoryExists: vi.fn().mockResolvedValue("sub-id"),
    getUserCategories: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({
    categories: [],
    subCategories: [],
    isLoadingCategories: false,
    refetchCategories,
    invalidateAllData,
    deleteEntity: vi.fn(),
  }),
}));

vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({ activeLedger: { id: "ledger-1", name: "Home" } }),
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

describe("useCategoryManagement - add category", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens a dialog instead of calling window.prompt", () => {
    const promptSpy = vi.spyOn(window, "prompt");
    const { result } = renderHook(() => useCategoryManagement(), { wrapper });

    expect(result.current.isDialogOpen).toBe(false);

    act(() => {
      result.current.handleAddClick();
    });

    expect(result.current.isDialogOpen).toBe(true);
    expect(promptSpy).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it("persists the new category via ensureCategoryExists", async () => {
    const { result } = renderHook(() => useCategoryManagement(), { wrapper });

    await result.current.addCategoryMutation.mutateAsync("Groceries");

    await waitFor(() => {
      expect(ensureCategoryExists).toHaveBeenCalledWith(
        "Groceries",
        "ledger-1",
      );
    });
  });
});
