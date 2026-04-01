import { render, screen } from "@testing-library/react";

let mockIsSignedIn = false;
jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isSignedIn: mockIsSignedIn }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import PricingTable from "@/components/PricingTable";

describe("PricingTable Component", () => {
  beforeEach(() => {
    mockIsSignedIn = false;
    render(<PricingTable />);
  });

  it("renders all 3 plan names", () => {
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Agent")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
  });

  it("displays correct prices", () => {
    expect(screen.getByText("$49")).toBeInTheDocument();
    expect(screen.getByText("$149")).toBeInTheDocument();
    expect(screen.getByText("$499")).toBeInTheDocument();
  });

  it("displays correct API call limits", () => {
    expect(screen.getByText("10,000 API calls")).toBeInTheDocument();
    expect(screen.getByText("100,000 API calls")).toBeInTheDocument();
    expect(screen.getByText("500,000 API calls")).toBeInTheDocument();
  });

  it("shows 'Most Popular' badge on Agent plan", () => {
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });

  it("renders 3 buttons", () => {
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("shows 'Get Started' when user is not signed in", () => {
    const buttons = screen.getAllByText("Get Started");
    expect(buttons.length).toBe(3);
  });

  it("displays plan taglines", () => {
    expect(screen.getByText(/Perfect for testing/)).toBeInTheDocument();
    expect(screen.getByText(/Built for production/)).toBeInTheDocument();
    expect(screen.getByText(/high-volume automation/)).toBeInTheDocument();
  });

  it("shows excluded features for Starter plan", () => {
    expect(screen.getByText("Webhooks")).toBeInTheDocument();
    expect(screen.getByText("Priority support")).toBeInTheDocument();
  });
});

describe("PricingTable - Signed In", () => {
  it("shows plan-specific CTAs when signed in", () => {
    mockIsSignedIn = true;
    render(<PricingTable />);
    expect(screen.getByText("Start with Starter")).toBeInTheDocument();
    expect(screen.getByText("Get Agent Plan")).toBeInTheDocument();
    expect(screen.getByText("Go Enterprise")).toBeInTheDocument();
  });
});
