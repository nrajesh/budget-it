import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom"; // Ensure jest-dom matchers are available
import { ScheduledTransactionsTable } from "@/components/scheduled-transactions/ScheduledTransactionsTable";
import { BrowserRouter } from "react-router-dom";
import { ScheduledTransaction } from "@/types/dataProvider";

// Mock the contexts
vi.mock("@/contexts/TransactionsContext", () => ({
  useTransactions: () => ({
    accountCurrencyMap: new Map([["Test Account", "USD"]]),
  }),
}));

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    formatCurrency: (amount: number) => `$${amount}`,
  }),
}));

describe("ScheduledTransactionsTable", () => {
  const mockTransactions: ScheduledTransaction[] = [
    {
      id: "1",
      date: "2023-10-27T00:00:00.000Z",
      frequency: "Monthly",
      amount: 100,
      account: "Test Account",
      vendor: "Test Vendor",
      category: "Utilities",
      sub_category: "Electric",
      remarks: "Test Transaction",
      currency: "USD",
      user_id: "user1",
      created_at: "2023-01-01T00:00:00.000Z",
    },
    {
        id: "2",
        date: "2023-10-27T00:00:00.000Z",
        frequency: "Monthly",
        amount: 50,
        account: "Bank A",
        vendor: "Bank B",
        category: "Transfer",
        transfer_id: "transfer123",
        currency: "USD",
        user_id: "user1",
        created_at: "2023-01-01T00:00:00.000Z",
    }
  ];

  it("renders transactions correctly", () => {
    render(
      <BrowserRouter>
        <ScheduledTransactionsTable transactions={mockTransactions} />
      </BrowserRouter>
    );

    expect(screen.getByText("Test Vendor")).toBeInTheDocument();
    expect(screen.getByText("Test Account")).toBeInTheDocument();
    expect(screen.getByText("Utilities")).toBeInTheDocument();
  });

  it("renders interactive elements as buttons", () => {
    render(
      <BrowserRouter>
        <ScheduledTransactionsTable transactions={mockTransactions} />
      </BrowserRouter>
    );

    // Vendor should be a button
    const vendorButton = screen.getByText("Test Vendor").closest("button");
    expect(vendorButton).toBeInTheDocument();
    expect(vendorButton).toHaveAttribute("type", "button");

    // Account should be a button
    const accountButton = screen.getByText("Test Account").closest("button");
    expect(accountButton).toBeInTheDocument();
    expect(accountButton).toHaveAttribute("type", "button");

    // Category should be a button
    const categoryButton = screen.getByText("Utilities").closest("button");
    expect(categoryButton).toBeInTheDocument();
    // Badge variants apply classes, so we check if it is a button
  });

  it("renders unlink button with aria-label", () => {
      // We need to provide onUnlink prop to see the button usually, or just check the second transaction which has transfer_id
      // The button is rendered if transaction.transfer_id is present
      render(
      <BrowserRouter>
        <ScheduledTransactionsTable transactions={mockTransactions} onUnlink={() => {}} />
      </BrowserRouter>
    );

    const unlinkButtons = screen.getAllByLabelText("Unlink Pair");
    expect(unlinkButtons.length).toBeGreaterThan(0);
    expect(unlinkButtons[0]).toBeInTheDocument();
  });
});
