import { act, renderHook } from "@testing-library/react";
import { useSuggest } from "./useSuggest";

const content = {
  _id: "name-1",
  createdBy: { _id: "creator-1" },
  tags: [{ _id: "tag-1", tag: "cute" }],
};

describe("useSuggest", () => {
  it("opens and closes the suggestion dialog with target content", () => {
    const { result } = renderHook(() => useSuggest());

    expect(result.current.showSuggestionDialog).toBe(false);
    expect(result.current.suggestionTarget).toBeNull();

    act(() => {
      result.current.openSuggestion(content);
    });

    expect(result.current.showSuggestionDialog).toBe(true);
    expect(result.current.suggestionTarget).toEqual(content);

    act(() => {
      result.current.closeSuggestion();
    });

    expect(result.current.showSuggestionDialog).toBe(false);
    expect(result.current.suggestionTarget).toBeNull();
  });
});
