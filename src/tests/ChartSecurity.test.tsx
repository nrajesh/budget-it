import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChartStyle } from "@/components/ui/chart";

describe("ChartStyle", () => {
  it("should sanitize malicious keys in config to prevent XSS", () => {
    const maliciousKey = "</style><script>alert('XSS')</script>";
    const config = {
      [maliciousKey]: {
        label: "Malicious",
        color: "red",
      },
    };

    const { container } = render(
      <ChartStyle id="test-chart" config={config} />
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();

    const content = styleTag?.innerHTML || "";
    // We expect the key to be sanitized so it doesn't break out of the style tag
    expect(content).not.toContain("</style>");
    expect(content).not.toContain("<script>");
  });
});
