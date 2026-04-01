import { render, screen } from "@testing-library/react";
import Features from "@/components/Features";

describe("Features Component", () => {
  beforeEach(() => {
    render(<Features />);
  });

  it("renders section heading", () => {
    expect(screen.getByText(/Everything You Need/)).toBeInTheDocument();
  });

  it("renders all 6 feature titles", () => {
    expect(screen.getByText("Multi-Platform Coverage")).toBeInTheDocument();
    expect(screen.getByText("Real-Time Data")).toBeInTheDocument();
    expect(screen.getByText("Nationwide Reach")).toBeInTheDocument();
    expect(screen.getByText("Fault Isolation")).toBeInTheDocument();
    expect(screen.getByText("Built for Scale")).toBeInTheDocument();
    expect(screen.getByText("Developer-Friendly")).toBeInTheDocument();
  });

  it("renders feature descriptions", () => {
    expect(screen.getByText(/All major US marketplaces/)).toBeInTheDocument();
    expect(screen.getByText(/15-minute cache refresh/)).toBeInTheDocument();
  });

  it("renders 6 feature icons", () => {
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBe(6);
  });
});
