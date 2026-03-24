import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DataManagementPage from "./DataManagementPage";

const mockNavigate = vi.fn();
const mockClearAllData = vi.fn().mockResolvedValue(undefined);
const mockRefreshLedgers = vi.fn().mockResolvedValue([]);
const mockGenerateDiverseDemoData = vi.fn().mockResolvedValue(undefined);
const mockClearAllTransactions = vi.fn().mockResolvedValue(undefined);
const mockHandleClearAllFilters = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => ({
    clearAllData: mockClearAllData,
  }),
}));

vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({
    generateDiverseDemoData: mockGenerateDiverseDemoData,
    clearAllTransactions: mockClearAllTransactions,
  }),
}));

vi.mock("@/hooks/transactions/useTransactionFilters", () => ({
  useTransactionFilters: () => ({
    handleClearAllFilters: mockHandleClearAllFilters,
  }),
}));

vi.mock("@/contexts/LedgerContext", () => ({
  useLedger: () => ({
    refreshLedgers: mockRefreshLedgers,
  }),
}));

vi.mock("@/utils/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/dialogs/PasswordDialog", () => ({
  default: () => null,
}));

vi.mock("@/components/dialogs/ConfirmationDialog", () => ({
  default: ({
    title,
    confirmText,
    onConfirm,
  }: {
    title: string;
    confirmText?: string;
    onConfirm: () => void;
  }) => (
    <button onClick={onConfirm} data-testid={`confirm-${confirmText || title}`}>
      {confirmText || title}
    </button>
  ),
}));

describe("DataManagementPage reset flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses transactions reset flow without direct provider reset", async () => {
    render(<DataManagementPage />);

    fireEvent.click(screen.getByTestId("confirm-Reset Data"));

    await waitFor(() => {
      expect(mockClearAllTransactions).toHaveBeenCalledTimes(1);
    });
    expect(mockClearAllData).not.toHaveBeenCalled();
  });
});
