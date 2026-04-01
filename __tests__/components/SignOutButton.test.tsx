import { render, screen } from "@testing-library/react";

jest.mock("@clerk/nextjs", () => ({
  SignOutButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import SignOutButton from "@/components/SignOutButton";

describe("SignOutButton Component", () => {
  it("renders Sign Out button", () => {
    render(<SignOutButton />);
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });

  it("renders as a button element", () => {
    render(<SignOutButton />);
    const button = screen.getByText("Sign Out");
    expect(button.tagName).toBe("BUTTON");
  });
});
