import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
});

let mockIsSignedIn = false;
jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isSignedIn: mockIsSignedIn }),
}));

import Navbar from "@/components/Navbar";

describe("Navbar - Signed Out", () => {
  beforeEach(() => {
    mockIsSignedIn = false;
    render(<Navbar />);
  });

  it("renders logo link", () => {
    const logo = screen.getByText("ScoutAPI");
    expect(logo.closest("a")).toHaveAttribute("href", "/");
  });

  it("renders Docs link", () => {
    const links = screen.getAllByText("Docs");
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0].closest("a")).toHaveAttribute("href", "/docs");
  });

  it("shows Sign In and Get Started when signed out", () => {
    expect(screen.getAllByText("Sign In").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Get Started").length).toBeGreaterThanOrEqual(1);
  });

  it("renders hamburger button for mobile", () => {
    const button = screen.getByLabelText("Toggle menu");
    expect(button).toBeInTheDocument();
  });

  it("opens mobile menu when hamburger is clicked", () => {
    const button = screen.getByLabelText("Toggle menu");
    fireEvent.click(button);
    const docsLinks = screen.getAllByText("Docs");
    expect(docsLinks.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Navbar - Signed In", () => {
  beforeEach(() => {
    mockIsSignedIn = true;
    render(<Navbar />);
  });

  it("shows Dashboard link when signed in", () => {
    const dashLinks = screen.getAllByText("Dashboard");
    expect(dashLinks.length).toBeGreaterThanOrEqual(1);
    expect(dashLinks[0].closest("a")).toHaveAttribute("href", "/dashboard");
  });

  it("does not show Sign In or Get Started", () => {
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    expect(screen.queryByText("Get Started")).not.toBeInTheDocument();
  });
});
