import { render, screen } from "@testing-library/react";
import ListWithPawPrintIcon from "./ListWithPawPrintIcon";

describe("ListWithPawPrintIcon", () => {
  it("renders list item text", () => {
    render(
      <ul>
        <ListWithPawPrintIcon text="Community powered names" />
      </ul>,
    );

    expect(screen.getByText("Community powered names")).toBeInTheDocument();
  });

  it("renders as an li with optional className", () => {
    const { container } = render(
      <ul>
        <ListWithPawPrintIcon
          text="Bullet point"
          className="extra-class"
        />
      </ul>,
    );

    const item = container.querySelector("li.extra-class");
    expect(item).toBeInTheDocument();
    expect(item).toHaveTextContent("Bullet point");
  });
});
