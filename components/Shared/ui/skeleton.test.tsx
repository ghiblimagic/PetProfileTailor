import { render, screen } from "@testing-library/react";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders a div with pulse styling and merges custom className", () => {
    render(<Skeleton className="h-4 w-20" data-testid="skeleton" />);

    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton.tagName).toBe("DIV");
    expect(skeleton).toHaveClass("animate-pulse");
    expect(skeleton).toHaveClass("h-4");
    expect(skeleton).toHaveClass("w-20");
  });
});
