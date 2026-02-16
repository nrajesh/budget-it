import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";

// Mock Table Context required by TableHead
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <Table>
    <TableHeader>
      <TableRow>{children}</TableRow>
    </TableHeader>
    <TableBody />
  </Table>
);

describe("SortableHeader", () => {
  const mockOnSort = vi.fn();
  const mockOnSortReset = vi.fn();

  it("renders a button for interactivity", () => {
    render(
      <Wrapper>
        <SortableHeader
          label="Name"
          sortKey="name"
          sortConfig={null}
          onSort={mockOnSort}
          onSortReset={mockOnSortReset}
        />
      </Wrapper>
    );

    const button = screen.getByRole("button", { name: "Name" });
    expect(button).toBeInTheDocument();
  });

  it("applies aria-sort attribute correctly when sorted ascending", () => {
    render(
      <Wrapper>
        <SortableHeader
          label="Name"
          sortKey="name"
          sortConfig={{ key: "name", direction: "asc" }}
          onSort={mockOnSort}
          onSortReset={mockOnSortReset}
        />
      </Wrapper>
    );

    const th = screen.getByRole("columnheader", { name: "Name" });
    expect(th).toHaveAttribute("aria-sort", "ascending");
  });

  it("applies aria-sort attribute correctly when sorted descending", () => {
    render(
      <Wrapper>
        <SortableHeader
          label="Name"
          sortKey="name"
          sortConfig={{ key: "name", direction: "desc" }}
          onSort={mockOnSort}
          onSortReset={mockOnSortReset}
        />
      </Wrapper>
    );

    const th = screen.getByRole("columnheader", { name: "Name" });
    expect(th).toHaveAttribute("aria-sort", "descending");
  });

  it("calls onSort when button is clicked", () => {
    render(
      <Wrapper>
        <SortableHeader
          label="Name"
          sortKey="name"
          sortConfig={null}
          onSort={mockOnSort}
          onSortReset={mockOnSortReset}
        />
      </Wrapper>
    );

    const button = screen.getByRole("button", { name: "Name" });
    fireEvent.click(button);
    expect(mockOnSort).toHaveBeenCalledWith("name");
  });
});
