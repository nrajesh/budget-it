import { renderHook, act, waitFor } from "@testing-library/react";
import { useTransactionFormLogic } from "./useTransactionFormLogic";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mocks
const mockConvertBetweenCurrencies = vi.fn((amount, from, to) => {
  if (from === "USD" && to === "EUR") return amount * 0.9;
  return amount;
});

const mockAccountCurrencyMap = new Map([
  ["Account 1", "USD"],
  ["Account 2", "EUR"],
]);
const mockAccounts = [
  { id: "1", name: "Account 1" },
  { id: "2", name: "Account 2" },
];

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({
    accountCurrencyMap: mockAccountCurrencyMap,
    accounts: mockAccounts,
  }),
}));

const mockCurrencySymbols = { USD: "$", EUR: "€" };
vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    currencySymbols: mockCurrencySymbols,
    convertBetweenCurrencies: mockConvertBetweenCurrencies,
    selectedCurrency: "USD",
  }),
}));

const mockActiveLedger = { id: "ledger-1" };
vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({
    activeLedger: mockActiveLedger,
  }),
}));

const mockGetAccountCurrency = vi.fn().mockResolvedValue("USD");
const mockDataProvider = {
  getAccountCurrency: mockGetAccountCurrency,
};
vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => mockDataProvider,
}));

describe("useTransactionFormLogic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values when no transactionToEdit is provided", () => {
    const { result } = renderHook(() =>
      useTransactionFormLogic({ isOpen: true }),
    );

    expect(result.current.form.getValues("account")).toBe("");
    expect(result.current.form.getValues("amount")).toBe(0);
    expect(result.current.transactionType).toBe("expense");
    expect(result.current.accountCurrencySymbol).toBe("$"); // Default USD symbol
  });

  it("should initialize with transaction values when transactionToEdit is provided", () => {
    const transactionToEdit = {
      date: "2023-10-01",
      account: "Account 1",
      vendor: "Vendor A",
      category: "Food",
      amount: -50,
      remarks: "Lunch",
    };

    const { result } = renderHook(() =>
      useTransactionFormLogic({
        transactionToEdit,
        isOpen: true,
      }),
    );

    expect(result.current.form.getValues("account")).toBe("Account 1");
    expect(result.current.form.getValues("amount")).toBe(50); // Absolute value
    expect(result.current.transactionType).toBe("expense");
  });

  it("should set transaction type to income if amount is positive", () => {
    const transactionToEdit = {
      amount: 100, // Positive
    };

    const { result } = renderHook(() =>
      useTransactionFormLogic({
        transactionToEdit,
        isOpen: true,
      }),
    );

    expect(result.current.transactionType).toBe("income");
  });

  it("should update account currency symbol when account changes", async () => {
    const { result } = renderHook(() =>
      useTransactionFormLogic({ isOpen: true }),
    );

    act(() => {
      result.current.form.setValue("account", "Account 2");
    });

    await waitFor(() => {
      expect(result.current.accountCurrencySymbol).toBe("€");
    });
  });

  it("should detect transfer when vendor is an account", async () => {
    const { result } = renderHook(() =>
      useTransactionFormLogic({ isOpen: true }),
    );

    act(() => {
      result.current.form.setValue("vendor", "Account 2");
    });

    await waitFor(() => {
      expect(result.current.isTransfer).toBe(true);
    });
  });

  it("should auto-set category to Transfer when isTransfer is true", async () => {
    const { result } = renderHook(() =>
      useTransactionFormLogic({ isOpen: true }),
    );

    act(() => {
      result.current.form.setValue("vendor", "Account 2");
    });

    await waitFor(() => {
      expect(result.current.form.getValues("category")).toBe("Transfer");
    });
  });

  it("should calculate receiving amount for transfers with different currencies", async () => {
    const { result } = renderHook(() =>
      useTransactionFormLogic({ isOpen: true }),
    );

    act(() => {
      result.current.form.setValue("account", "Account 1"); // USD
      result.current.form.setValue("vendor", "Account 2"); // EUR
      result.current.form.setValue("amount", 100);
    });

    await waitFor(() => {
      expect(result.current.autoCalculatedReceivingAmount).toBe(90); // 100 * 0.9
      expect(result.current.form.getValues("receivingAmount")).toBe(90);
    });
  });
});
