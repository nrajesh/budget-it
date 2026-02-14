import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import TransactionTable from "@/components/transactions/TransactionTable";
import { BrowserRouter } from "react-router-dom";
import { Transaction } from "@/types/dataProvider";

// Mocks
vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    selectedCurrency: "USD",
  }),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTableSort", () => ({
  useTableSort: ({ data }: { data: unknown[] }) => ({
    sortedData: data,
    sortConfig: { key: "date", direction: "desc" },
    handleHeaderClick: vi.fn(),
    handleHeaderRightClick: vi.fn(),
  }),
}));

describe("TransactionTable", () => {
  const mockTransactions: Transaction[] = [
    {
      id: "1",
      date: "2023-10-27T00:00:00.000Z",
      amount: 100,
      account: "Test Account",
      vendor: "Test Vendor",
      category: "Utilities",
      sub_category: "Electric",
      remarks: "Test Transaction",
      currency: "USD",
      user_id: "user1",
      created_at: "2023-01-01T00:00:00.000Z",
      is_scheduled_origin: true,
      recurrence_id: "rec1",
    },
    {
      id: "2",
      date: "2023-10-27T00:00:00.000Z",
      amount: 50,
      account: "Bank A",
      vendor: "Bank B",
      category: "Transfer",
      transfer_id: "transfer123",
      currency: "USD",
      user_id: "user1",
      created_at: "2023-01-01T00:00:00.000Z",
    },
  ];

  it("renders 'Go to Scheduled Transaction' button with aria-label", () => {
    render(
      <BrowserRouter>
        <TransactionTable
            transactions={mockTransactions}
            loading={false}
            onRefresh={vi.fn()}
            onDeleteTransactions={vi.fn()}
            onAddTransaction={vi.fn()}
        />
      </BrowserRouter>,
    );

    const scheduleButton = screen.getByLabelText("Go to Scheduled Transaction");
    expect(scheduleButton).toBeInTheDocument();
    expect(scheduleButton.tagName).toBe("BUTTON");
  });

   it("renders 'Unlink Transfer' button with aria-label", () => {
    render(
      <BrowserRouter>
        <TransactionTable
            transactions={mockTransactions}
            loading={false}
            onRefresh={vi.fn()}
            onDeleteTransactions={vi.fn()}
            onAddTransaction={vi.fn()}
            onUnlinkTransaction={vi.fn()}
        />
      </BrowserRouter>,
    );

    const unlinkButton = screen.getByLabelText("Unlink Transfer");
    expect(unlinkButton).toBeInTheDocument();
    expect(unlinkButton.tagName).toBe("BUTTON");
  });
});
