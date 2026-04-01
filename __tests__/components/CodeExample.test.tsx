import { render, screen } from "@testing-library/react";
import CodeExample from "@/components/CodeExample";

describe("CodeExample Component", () => {
  beforeEach(() => {
    render(<CodeExample />);
  });

  it("renders section heading", () => {
    expect(screen.getByText("Simple API, Powerful Data")).toBeInTheDocument();
  });

  it("renders Request and Response labels", () => {
    expect(screen.getByText("Request")).toBeInTheDocument();
    expect(screen.getByText("Response")).toBeInTheDocument();
  });

  it("renders JavaScript and JSON language labels", () => {
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("JSON")).toBeInTheDocument();
  });

  it("renders fetch code example", () => {
    expect(screen.getByText(/api\.scoutapi\.dev/)).toBeInTheDocument();
  });

  it("renders JSON response example", () => {
    expect(screen.getByText(/iPhone 15 Pro 256GB/)).toBeInTheDocument();
  });

  it("renders code blocks with horizontal scroll", () => {
    const preElements = document.querySelectorAll("pre");
    expect(preElements.length).toBe(2);
    preElements.forEach((pre) => {
      expect(pre.className).toContain("overflow-x-auto");
    });
  });
});
