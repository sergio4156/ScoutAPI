import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ManageSubscription from "@/components/ManageSubscription";

// Mock fetch
global.fetch = jest.fn();

describe("ManageSubscription Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    render(<ManageSubscription />);
  });

  it("renders Manage Subscription button", () => {
    expect(screen.getByText("Manage Subscription")).toBeInTheDocument();
  });

  it("calls /api/portal on click", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ url: "https://billing.stripe.com/session/test" }),
    });

    fireEvent.click(screen.getByText("Manage Subscription"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/portal", { method: "POST" });
    });
  });

  it("shows loading state while fetching", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    fireEvent.click(screen.getByText("Manage Subscription"));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
