import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ShowTime from "./ShowTime";

describe("ShowTime", () => {
  it("renders formatted date with suppressHydrationWarning wrapper", () => {
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(
      () =>
        ({
          format: () => "Jan 1, 2024, 12:00 PM",
        }) as Intl.DateTimeFormat,
    );

    const { container } = render(
      <ShowTime postDate="2024-01-01T12:00:00.000Z" />,
    );

    expect(screen.getByText("Jan 1, 2024, 12:00 PM")).toBeInTheDocument();
    expect(container.querySelector("span")).toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it("applies optional styling class to the icon", () => {
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(
      () =>
        ({
          format: () => "formatted",
        }) as Intl.DateTimeFormat,
    );

    const { container } = render(
      <ShowTime postDate="2024-01-01T12:00:00.000Z" styling="text-white" />,
    );

    expect(container.querySelector(".text-white")).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
