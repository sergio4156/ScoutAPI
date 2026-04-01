import { render, screen } from "@testing-library/react";
import Hero from "@/components/Hero";

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
});

describe("Hero Component", () => {
  beforeEach(() => {
    render(<Hero />);
  });

  it("renders the main headline", () => {
    expect(screen.getByText("Real-time Marketplace Data")).toBeInTheDocument();
    expect(screen.getByText("for AI Agents")).toBeInTheDocument();
  });

  it("renders the beta badge", () => {
    expect(screen.getByText("Now in Beta")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    expect(screen.getByText(/Power your arbitrage bots/)).toBeInTheDocument();
  });

  it("renders CTA buttons with correct links", () => {
    const docsLink = screen.getByText("View Documentation");
    expect(docsLink).toBeInTheDocument();
    expect(docsLink.closest("a")).toHaveAttribute("href", "/docs");

    const pricingLink = screen.getByText("See Pricing");
    expect(pricingLink).toBeInTheDocument();
    expect(pricingLink.closest("a")).toHaveAttribute("href", "#pricing");
  });
});
