import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeStoreLinks from "@/components/homepage/HomeStoreLinks";

describe("HomeStoreLinks", () => {
  it("renders four placeholder cards by default", () => {
    render(<HomeStoreLinks />);
    expect(screen.getByText(/apple app store/i)).toBeInTheDocument();
    expect(screen.getByText(/google play store/i)).toBeInTheDocument();
    expect(screen.getByText(/lemon squeezy/i)).toBeInTheDocument();
    expect(screen.getByText(/polar\.sh/i)).toBeInTheDocument();
  });

  it("shows Coming Soon indicator on inactive cards", () => {
    render(<HomeStoreLinks />);
    // 4 card indicators + 1 in the intro text = 5 total "Coming soon" matches
    // Check specifically the card-level indicators (exact text match)
    const comingSoonElements = screen.getAllByText("Coming Soon");
    expect(comingSoonElements.length).toBe(4);
  });

  it("placeholder cards are not clickable links", () => {
    render(<HomeStoreLinks />);
    // None of the inactive cards should be anchor tags
    expect(
      screen.queryAllByRole("link", {
        name: /apple app store|google play store|lemon squeezy|polar\.sh/i,
      }).length,
    ).toBe(0);
  });
});
