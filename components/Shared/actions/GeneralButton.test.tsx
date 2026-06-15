import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import GeneralButton from "./GeneralButton";

describe("GeneralButton", () => {
  it("renders text and calls onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<GeneralButton text="Submit" onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Submit" });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("supports aria-label without visible text", () => {
    render(
      <GeneralButton ariaLabel="Close dialog" plain onClick={() => {}} />,
    );

    expect(
      screen.getByRole("button", { name: "Close dialog" }),
    ).toBeInTheDocument();
  });

  it("disables interaction when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <GeneralButton text="Save" disabled onClick={onClick} />,
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders children beside text", () => {
    render(
      <GeneralButton text="Next">
        <span data-testid="child-icon">→</span>
      </GeneralButton>,
    );

    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByTestId("child-icon")).toBeInTheDocument();
  });

  it("applies warning variant classes", () => {
    render(<GeneralButton text="Delete" warning />);

    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "bg-red-800",
    );
  });
});
