import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ToggeableAlert from "./ToggeableAlert";

function StringAlertHarness() {
  const [message, setMessage] = useState("You must be signed in to like content");
  if (!message) return <div data-testid="cleared">cleared</div>;
  return (
    <ToggeableAlert<string>
      text="You must be signed in to like content"
      toggleState={message}
      setToggleState={setMessage}
    />
  );
}

function BooleanAlertHarness() {
  const [open, setOpen] = useState(true);
  if (!open) return <div data-testid="cleared">cleared</div>;
  return (
    <ToggeableAlert<boolean>
      text="You cannot flag your own content"
      toggleState={open}
      setToggleState={setOpen}
    />
  );
}

describe("ToggeableAlert", () => {
  it("renders alert text and a Close button", () => {
    render(
      <ToggeableAlert
        text="Session required"
        toggleState="Session required"
        setToggleState={() => {}}
      />,
    );

    expect(screen.getByText("Session required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("dismisses string state by clearing to empty string", async () => {
    const user = userEvent.setup();
    render(<StringAlertHarness />);

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      screen.queryByText("You must be signed in to like content"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("cleared")).toBeInTheDocument();
  });

  it("dismisses boolean state by setting false", async () => {
    const user = userEvent.setup();
    render(<BooleanAlertHarness />);

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      screen.queryByText("You cannot flag your own content"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("cleared")).toBeInTheDocument();
  });
});
