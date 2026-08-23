import { render, screen } from "@testing-library/react";
import TagsSelectAndCheatSheet from "./TagsSelectAndCheatSheet";

// Real useCategoriesForDataType reads from CategoriesAndTagsContext — swap
// it for a fixed tag list so the test doesn't need that provider.
vi.mock("@/hooks/useCategoriesForDataType", () => ({
  useCategoriesForDataType: () => ({
    categoriesWithTags: [],
    tagList: [
      { label: "Senior", value: "tag-1" },
      { label: "Friendly", value: "tag-2" },
    ],
  }),
}));

describe("TagsSelectAndCheatSheet", () => {
  // Regression: the select field's chosen-tag chips render via a custom
  // react-select `MultiValue` override (TagPillMultiValue) that used to
  // destructure `innerProps` — react-select never actually supplies that
  // prop at the top-level MultiValue (only its Container/Label/Remove
  // sub-parts get one), so it crashed with "innerProps is undefined" the
  // moment any tag was already selected / got selected.
  it("renders an already-selected tag as a pill without crashing", () => {
    const { container } = render(
      <TagsSelectAndCheatSheet
        dataType="names"
        tagsToSubmit={[{ label: "Senior", value: "tag-1" }]}
        handleSelectChange={() => {}}
        handleCheckboxChange={() => {}}
      />
    );

    expect(container.textContent).toContain("#Senior");
    expect(
      screen.getByRole("button", { name: "Remove Senior" })
    ).toBeInTheDocument();
  });
});
