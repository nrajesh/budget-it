import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Table, TableHeader, TableRow } from "@/components/ui/table";
import "@testing-library/jest-dom";

// Wrapper to render SortableHeader within a Table context
const renderHeader = (props: any) => {
  return render(
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader {...props} />
        </TableRow>
      </TableHeader>
    </Table>,
  );
};

describe("SortableHeader", () => {
  const mockOnSort = vi.fn();
  const mockOnSortReset = vi.fn();

  it("renders a button with correct label", () => {
    renderHeader({
      label: "Test Header",
      sortKey: "test",
      sortConfig: null,
      onSort: mockOnSort,
      onSortReset: mockOnSortReset,
    });

    const button = screen.getByRole("button", { name: "Test Header" });
    expect(button).toBeInTheDocument();
  });

  it("calls onSort when clicked", () => {
    renderHeader({
      label: "Test Header",
      sortKey: "test",
      sortConfig: null,
      onSort: mockOnSort,
      onSortReset: mockOnSortReset,
    });

    const button = screen.getByRole("button", { name: "Test Header" });
    fireEvent.click(button);
    expect(mockOnSort).toHaveBeenCalledWith("test");
  });

  it("has correct aria-sort attribute when sorted ascending", () => {
    renderHeader({
      label: "Test Header",
      sortKey: "test",
      sortConfig: { key: "test", direction: "asc" },
      onSort: mockOnSort,
      onSortReset: mockOnSortReset,
    });

    const th = screen.getByRole("columnheader");
    expect(th).toHaveAttribute("aria-sort", "ascending");
  });

  it("has correct aria-sort attribute when sorted descending", () => {
    renderHeader({
      label: "Test Header",
      sortKey: "test",
      sortConfig: { key: "test", direction: "desc" },
      onSort: mockOnSort,
      onSortReset: mockOnSortReset,
    });

    const th = screen.getByRole("columnheader");
    expect(th).toHaveAttribute("aria-sort", "descending");
  });

  it("has correct aria-sort attribute when not sorted", () => {
    renderHeader({
      label: "Test Header",
      sortKey: "test",
      sortConfig: null, // or different key
      onSort: mockOnSort,
      onSortReset: mockOnSortReset,
    });

    const th = screen.getByRole("columnheader");
    expect(th).toHaveAttribute("aria-sort", "none");
  });

  it("applies justify-end class when text-right is in className", () => {
    renderHeader({
      label: "Amount",
      sortKey: "amount",
      sortConfig: null,
      onSort: mockOnSort,
      onSortReset: mockOnSortReset,
      className: "text-right",
    });

    const button = screen.getByRole("button", { name: "Amount" });
    expect(button).toHaveClass("justify-end");
  });
});
