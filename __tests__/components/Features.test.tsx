import { render, screen } from "@testing-library/react";
import Features from "@/components/Features";

describe("Features Component", () => {
  beforeEach(() => {
    render(<Features />);
  });

  it("renders section heading", () => {
    expect(screen.getByText("Why AI Teams Choose ScoutAPI")).toBeInTheDocument();
  });

  it("renders all 4 feature titles", () => {
    expect(screen.getByText("Built for AI Agents")).toBeInTheDocument();
    expect(screen.getByText("Stealth Scraping")).toBeInTheDocument();
    expect(screen.getByText("Blazing Fast")).toBeInTheDocument();
    expect(screen.getByText("Arbitrage Ready")).toBeInTheDocument();
  });

  it("renders feature descriptions", () => {
    expect(screen.getByText(/Structured JSON output/)).toBeInTheDocument();
    expect(screen.getByText(/Puppeteer with stealth/)).toBeInTheDocument();
    expect(screen.getByText(/under a second/)).toBeInTheDocument();
    expect(screen.getByText(/Compare prices/)).toBeInTheDocument();
  });

  it("renders 4 feature icons", () => {
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBe(4);
  });
});
