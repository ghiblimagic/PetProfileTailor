import { useState, type ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StyledCheckbox from "./StyledCheckbox";

function ControlledCheckbox(
  props: Omit<ComponentProps<typeof StyledCheckbox>, "checked" | "onChange">,
) {
  const [checked, setChecked] = useState(false);
  return (
    <StyledCheckbox
      {...props}
      checked={checked}
      onChange={(e) => setChecked(e.target.checked)}
    />
  );
}

describe("StyledCheckbox", () => {
  it("links label to input via the stable value id", () => {
    render(
      <StyledCheckbox
        label="Favorites only"
        value="filter-favorites"
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole("checkbox", { name: /favorites only/i });
    expect(input).toHaveAttribute("id", "filter-favorites");
    expect(input).toHaveAttribute("value", "filter-favorites");
  });

  it("calls onChange when toggled", async () => {
    const user = userEvent.setup();
    render(<ControlledCheckbox label="Keep text" value="keep-text" />);

    const checkbox = screen.getByRole("checkbox", { name: /keep text/i });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <StyledCheckbox
        label="Disabled option"
        value="disabled-opt"
        disabled
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /disabled option/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders optional description text", () => {
    render(
      <ControlledCheckbox
        label="Tag filter"
        description="Narrow results by tag"
        value="tag-filter"
      />,
    );

    expect(screen.getByText("Narrow results by tag")).toBeInTheDocument();
  });
});
