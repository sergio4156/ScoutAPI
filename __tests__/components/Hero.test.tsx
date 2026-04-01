import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => {
  return ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
});

let mockIsSignedIn = false;
jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isSignedIn: mockIsSignedIn }),
}));

import Hero from "@/components/Hero";

describe("Hero Component - Signed Out", () => {
  beforeEach(() => {
    mockIsSignedIn = false;
    render(<Hero />);
  });

  it("renders the main headline", () => {
    expect(screen.getByText(/Multi-Platform Marketplace/)).toBeInTheDocument();
    expect(screen.getByText(/Intelligence API/)).toBeInTheDocument();
  });

  it("renders the badge", () => {
    expect(screen.getByText(/4 Platforms/)).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    expect(screen.getByText(/Access real-time data/)).toBeInTheDocument();
  });

  it("renders Get API Access linking to sign-up", () => {
    const btn = screen.getByText("Get API Access");
    expect(btn.closest("a")).toHaveAttribute("href", "/sign-up");
  });

  it("renders trust elements with green checkmarks", () => {
    expect(screen.getByText("4 platforms in one API")).toBeInTheDocument();
    expect(screen.getByText("15-minute data freshness")).toBeInTheDocument();
    expect(screen.getByText("US nationwide coverage")).toBeInTheDocument();
  });
});

describe("Hero Component - Signed In", () => {
  it("renders Go to Dashboard linking to dashboard", () => {
    mockIsSignedIn = true;
    render(<Hero />);
    const btn = screen.getByText("Go to Dashboard");
    expect(btn.closest("a")).toHaveAttribute("href", "/dashboard");
  });
});
