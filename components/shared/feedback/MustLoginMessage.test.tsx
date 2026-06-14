import { render, screen } from "@testing-library/react";
import MustLoginMessage from "./MustLoginMessage";

describe("MustLoginMessage", () => {
  it("renders the sign-in gate copy with the action text", () => {
    render(<MustLoginMessage text="add names" />);

    expect(
      screen.getByText("To avoid spam, users must sign in to add names"),
    ).toBeInTheDocument();
  });
});
