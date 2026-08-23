import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import NewDescriptionWithTagsData from "./addingdescription";

const mocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: mocks.useSession,
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt} />,
}));

// Real useCategoriesForDataType reads from CategoriesAndTagsContext — swap
// it for a fixed category/tag so the test doesn't need that provider, and
// so the select field's tagList and the cheat sheet's checkbox line up on
// the same tag (needed to actually pick a tag through the UI below).
vi.mock("@/hooks/useCategoriesForDataType", () => ({
  useCategoriesForDataType: () => ({
    categoriesWithTags: [
      { _id: "cat-1", category: "Age", tags: [{ _id: "tag-1", tag: "Senior" }] },
    ],
    tagList: [{ label: "Senior", value: "tag-1" }],
  }),
}));

const signedIn = {
  data: { user: { id: "user-1", name: "Pat" } },
  status: "authenticated",
};
const signedOut = { data: null, status: "unauthenticated" };

function submitButton() {
  return screen.getByRole("button", { name: /add description/i });
}

describe("NewDescriptionWithTagsData — submit button disabled reasons", () => {
  it("is disabled with a sign-in reason when signed out", () => {
    mocks.useSession.mockReturnValue(signedOut);
    render(<NewDescriptionWithTagsData />);

    expect(submitButton()).toBeDisabled();
    expect(submitButton()).toHaveTextContent(
      "Add description (sign in to submit)"
    );
  });

  it("is disabled with a character-count reason when signed in but too short", async () => {
    const user = userEvent.setup();
    mocks.useSession.mockReturnValue(signedIn);
    render(<NewDescriptionWithTagsData />);

    await user.type(screen.getByLabelText(/description/i), "short");

    expect(submitButton()).toBeDisabled();
    expect(submitButton()).toHaveTextContent(
      "Add description (min. 10 characters)"
    );
  });

  it("is disabled with a tag-selection reason once text is long enough but no tag is picked", async () => {
    const user = userEvent.setup();
    mocks.useSession.mockReturnValue(signedIn);
    render(<NewDescriptionWithTagsData />);

    await user.type(
      screen.getByLabelText(/description/i),
      "A long enough description"
    );

    expect(submitButton()).toBeDisabled();
    expect(submitButton()).toHaveTextContent(
      "Add description (select at least 1 tag)"
    );
  });

  it("is enabled once signed in, text is long enough, and a tag is selected", async () => {
    const user = userEvent.setup();
    mocks.useSession.mockReturnValue(signedIn);
    render(<NewDescriptionWithTagsData />);

    await user.type(
      screen.getByLabelText(/description/i),
      "A long enough description"
    );

    // Reveal the cheat sheet, expand its one category, and pick its one tag.
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Age" }));
    await user.click(screen.getByRole("checkbox", { name: "Senior" }));

    expect(submitButton()).toHaveTextContent("Add description");
    expect(submitButton()).not.toBeDisabled();
  });
});
