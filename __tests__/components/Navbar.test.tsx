import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("next/link", () => {
  return ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
});

let mockIsSignedIn = false;
jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isSignedIn: mockIsSignedIn }),
  SignOutButton: ({ children }: { children: React.ReactNode }) => <div data-testid="signout-wrapper">{children}</div>,
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

  it("renders Documentation link", () => {
    const links = screen.getAllByText("Documentation");
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0].closest("a")).toHaveAttribute("href", "/docs");
  });

  it("shows Sign In and Get API Access when signed out", () => {
    expect(screen.getAllByText("Sign In").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Get API Access").length).toBeGreaterThanOrEqual(1);
  });

  it("renders hamburger button for mobile", () => {
    const button = screen.getByLabelText("Toggle menu");
    expect(button).toBeInTheDocument();
  });

  it("opens mobile menu when hamburger is clicked", () => {
    const button = screen.getByLabelText("Toggle menu");
    fireEvent.click(button);
    const docLinks = screen.getAllByText("Documentation");
    expect(docLinks.length).toBeGreaterThanOrEqual(2);
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

  it("shows Sign Out button when signed in", () => {
    const signOutButtons = screen.getAllByText("Sign Out");
    expect(signOutButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("does not show Get API Access", () => {
    expect(screen.queryByText("Get API Access")).not.toBeInTheDocument();
  });
});
