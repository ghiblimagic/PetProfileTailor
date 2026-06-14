import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PreserveTextAfterSubmission from "./preserveTextAfterSubmission";

function Harness({ initial = false }: { initial?: boolean }) {
  const [doNotClear, setDoNotClear] = useState(initial);
  return (
    <div>
      <span data-testid="state">{doNotClear ? "keep" : "clear"}</span>
      <PreserveTextAfterSubmission
        doNotClear={doNotClear}
        setDoNotClear={setDoNotClear}
      />
    </div>
  );
}

describe("PreserveTextAfterSubmission", () => {
  it("renders helper copy and the Keep text checkbox", () => {
    render(<Harness />);

    expect(
      screen.getByText(/Entering lots of similar content/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /keep text/i }),
    ).toBeInTheDocument();
  });

  it("updates doNotClear when the checkbox is toggled", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByTestId("state")).toHaveTextContent("clear");

    await user.click(screen.getByRole("checkbox", { name: /keep text/i }));

    expect(screen.getByTestId("state")).toHaveTextContent("keep");
  });
});
