import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WarningMessage from "./WarningMessage";

function DismissibleHarness({ initial = "Invalid characters entered" }) {
  const [message, setMessage] = useState(initial);
  if (!message) return <div data-testid="cleared">cleared</div>;
  return <WarningMessage message={message} state={setMessage} />;
}

describe("WarningMessage", () => {
  it("renders the validation message", () => {
    render(<WarningMessage message="Name cannot include @" />);

    expect(screen.getByText("Name cannot include @")).toBeInTheDocument();
  });

  it("hides dismiss control when no state setter is passed", () => {
    render(<WarningMessage message="Read-only warning" />);

    expect(
      screen.queryByRole("button", { name: "Close message" }),
    ).not.toBeInTheDocument();
  });

  it("clears the message when dismiss is clicked", async () => {
    const user = userEvent.setup();
    render(<DismissibleHarness />);

    await user.click(screen.getByRole("button", { name: "Close message" }));

    expect(screen.queryByText("Invalid characters entered")).not.toBeInTheDocument();
    expect(screen.getByTestId("cleared")).toBeInTheDocument();
  });
});
