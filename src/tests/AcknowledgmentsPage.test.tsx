import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AcknowledgmentsPage from "@/pages/AcknowledgmentsPage";

describe("AcknowledgmentsPage", () => {
  it("renders without throwing", () => {
    render(
      <MemoryRouter>
        <AcknowledgmentsPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", {
        name: /open source licenses|acknowledgments/i,
      }),
    ).toBeInTheDocument();
  });

  it("lists at least one dependency", () => {
    render(
      <MemoryRouter>
        <AcknowledgmentsPage />
      </MemoryRouter>,
    );
    // We expect react itself to be in the list
    expect(screen.getAllByText(/react/i).length).toBeGreaterThan(0);
  });
});
