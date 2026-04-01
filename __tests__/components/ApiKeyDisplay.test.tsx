import { render, screen, fireEvent } from "@testing-library/react";
import ApiKeyDisplay from "@/components/ApiKeyDisplay";

// Mock clipboard API
Object.assign(navigator, {
  clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
});

describe("ApiKeyDisplay Component", () => {
  const keyPreview = "sk_live_...abc123";

  beforeEach(() => {
    render(<ApiKeyDisplay keyPreview={keyPreview} />);
  });

  it("renders the key preview", () => {
    expect(screen.getByText(keyPreview)).toBeInTheDocument();
  });

  it("renders Copy button", () => {
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("copies key to clipboard on click", () => {
    fireEvent.click(screen.getByText("Copy"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(keyPreview);
  });

  it("shows 'Copied!' after clicking copy", () => {
    fireEvent.click(screen.getByText("Copy"));
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it("renders security warning", () => {
    expect(screen.getByText(/Keep your API key secret/)).toBeInTheDocument();
  });
});
