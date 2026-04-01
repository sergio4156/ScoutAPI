import { render, screen } from "@testing-library/react";
import CodeExample from "@/components/CodeExample";

describe("CodeExample Component", () => {
  beforeEach(() => {
    render(<CodeExample />);
  });

  it("renders section heading", () => {
    expect(screen.getByText(/One API Call/)).toBeInTheDocument();
  });

  it("renders Request and Response labels", () => {
    expect(screen.getByText("Request")).toBeInTheDocument();
    expect(screen.getByText("Response")).toBeInTheDocument();
  });

  it("renders language labels", () => {
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("JSON")).toBeInTheDocument();
  });

  it("renders multi-platform code example", () => {
    expect(screen.getByText(/Multi-platform search/)).toBeInTheDocument();
  });

  it("renders code blocks with horizontal scroll", () => {
    const preElements = document.querySelectorAll("pre");
    expect(preElements.length).toBe(2);
    preElements.forEach((pre) => {
      expect(pre.className).toContain("overflow-x-auto");
    });
  });
});
