import { act, renderHook } from "@testing-library/react";
import { useFlagging } from "./useFlagging";

const content = { _id: "name-1" };

describe("useFlagging", () => {
  it("opens and closes the flag dialog with target content", () => {
    const { result } = renderHook(() => useFlagging());

    expect(result.current.showFlagDialog).toBe(false);
    expect(result.current.flagTarget).toBeNull();

    act(() => {
      result.current.openFlag(content);
    });

    expect(result.current.showFlagDialog).toBe(true);
    expect(result.current.flagTarget).toEqual(content);

    act(() => {
      result.current.closeFlag();
    });

    expect(result.current.showFlagDialog).toBe(false);
    expect(result.current.flagTarget).toBeNull();
  });
});
