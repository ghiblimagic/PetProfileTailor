import { useState, useEffect, type ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import CheckIfContentExists from "./CheckIfContentExists";

vi.mock("../ShowingListOfContent/ContentListing", () => ({
  default: ({ singleContent }: { singleContent: { content?: string } }) => (
    <div data-testid="content-listing">{singleContent.content}</div>
  ),
}));

function Harness({
  initial = "fluffy",
  ...props
}: Partial<ComponentProps<typeof CheckIfContentExists>> & {
  initial?: string;
}) {
  const [value, setValue] = useState("");
  const [processing, setProcessing] = useState(false);

  // Child resets parent value on mount; restore query text (mirrors add-names input staying in sync)
  useEffect(() => {
    setValue(initial);
  }, [initial]);
  return (
    <CheckIfContentExists
      apiString="/api/names/check-if-content-exists/"
      contentType="names"
      value={value}
      onChange={setValue}
      checkIsProcessing={processing}
      setCheckIsProcessing={setProcessing}
      addNamesPage
      {...props}
    />
  );
}

describe("CheckIfContentExists", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders name-specific heading", () => {
    render(<Harness contentType="names" />);
    expect(screen.getByText("Check if a name exists:")).toBeInTheDocument();
  });

  it("renders description-specific heading", () => {
    render(<Harness contentType="descriptions" />);
    expect(
      screen.getByText("Check if a description exists:"),
    ).toBeInTheDocument();
  });

  it("disables search when input is too short", () => {
    render(<Harness initial="a" />);
    expect(screen.getByRole("button", { name: /search/i })).toBeDisabled();
  });

  it("disables search when invalidInput is set", () => {
    render(<Harness invalidInput={["@"]} />);
    expect(screen.getByRole("button", { name: /search/i })).toBeDisabled();
  });

  it("shows duplicate message when content already exists", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        type: "duplicate",
        data: { _id: "1", content: "fluffy" },
      }),
    } as Response);

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Ruh Roh! This content already exists: fluffy/i),
      ).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/names/check-if-content-exists/fluffy",
    );
  });

  it("shows success message when content is available", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        type: "success",
        message: "Name is available!",
      }),
    } as Response);

    render(<Harness initial="uniquepup" />);
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText("Name is available!")).toBeInTheDocument();
    });
  });

  it("shows server error message on non-ok response", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Invalid content" }),
    } as Response);

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid content")).toBeInTheDocument();
    });
  });

  it("reveals existing content when show content is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        type: "duplicate",
        data: { _id: "1", content: "fluffy" },
      }),
    } as Response);

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /show content/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /show content/i }));

    expect(screen.getByTestId("content-listing")).toHaveTextContent("fluffy");
  });
});
