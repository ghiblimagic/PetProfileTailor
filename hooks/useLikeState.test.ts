import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useLikeState, type LikeableContent } from "./useLikeState";
import type { RecentLikesRef } from "@/context/LikesContext";

const mocks = vi.hoisted(() => {
  const recentLikesRef: { current: RecentLikesRef } = { current: {} };
  const addLike = vi.fn();
  const deleteLike = vi.fn();
  let hasLiked = false;

  return {
    recentLikesRef,
    addLike,
    deleteLike,
    hasLikedFn: vi.fn(() => hasLiked),
    setHasLiked: (value: boolean) => {
      hasLiked = value;
    },
    toggleOpts: null as {
      onApplyOptimistic?: (newLiked: boolean) => unknown;
      onRollback?: (rollback: unknown) => void;
    } | null,
    toggle: vi.fn(),
  };
});

vi.mock("@/context/LikesContext", () => ({
  useLikes: () => ({
    hasLiked: mocks.hasLikedFn,
    addLike: mocks.addLike,
    deleteLike: mocks.deleteLike,
    recentLikesRef: mocks.recentLikesRef,
  }),
}));

vi.mock("./useToggleState", () => ({
  useToggleState: (opts: {
    onApplyOptimistic?: (newLiked: boolean) => unknown;
    onRollback?: (rollback: unknown) => void;
  }) => {
    mocks.toggleOpts = opts;
    return {
      active: false,
      isProcessing: false,
      toggle: mocks.toggle,
    };
  },
}));

const content: LikeableContent = {
  _id: "content-1",
  likedByCount: 10,
  createdBy: {
    _id: "creator-1",
    name: "Creator",
    profileName: "creator",
  },
};

describe("useLikeState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.recentLikesRef.current = {};
    mocks.setHasLiked(false);
    mocks.toggleOpts = null;
  });

  it("starts with likedByCount plus session recent delta", () => {
    mocks.recentLikesRef.current = { "content-1": 1 };

    const { result } = renderHook(() =>
      useLikeState({
        data: content,
        dataType: "names",
        apiBaseLink: "/api/names/likes",
      }),
    );

    expect(result.current.likeCount).toBe(11);
    expect(result.current.toggleLike).toBe(mocks.toggle);
  });

  it("optimistic like increments count and registers addLike", () => {
    const { result } = renderHook(() =>
      useLikeState({
        data: content,
        dataType: "names",
        apiBaseLink: "/api/names/likes",
      }),
    );

    act(() => {
      mocks.toggleOpts?.onApplyOptimistic?.(true);
    });

    expect(mocks.addLike).toHaveBeenCalledWith("names", "content-1");
    expect(mocks.deleteLike).not.toHaveBeenCalled();
    expect(mocks.recentLikesRef.current["content-1"]).toBe(1);
    expect(result.current.likeCount).toBe(11);
  });

  it("optimistic unlike on initially liked content decrements count", () => {
    mocks.setHasLiked(true);

    const { result } = renderHook(() =>
      useLikeState({
        data: content,
        dataType: "descriptions",
        apiBaseLink: "/api/description/likes",
      }),
    );

    act(() => {
      mocks.toggleOpts?.onApplyOptimistic?.(false);
    });

    expect(mocks.deleteLike).toHaveBeenCalledWith("descriptions", "content-1");
    expect(mocks.recentLikesRef.current["content-1"]).toBe(-1);
    expect(result.current.likeCount).toBe(9);
  });

  it("rollback restores count and recentLikesRef after failed toggle", () => {
    mocks.setHasLiked(false);
    mocks.recentLikesRef.current = { "content-1": 1 };

    const { result } = renderHook(() =>
      useLikeState({
        data: content,
        dataType: "names",
        apiBaseLink: "/api/names/likes",
      }),
    );

    act(() => {
      mocks.toggleOpts?.onRollback?.(1);
    });

    expect(mocks.addLike).toHaveBeenCalledWith("names", "content-1");
    expect(mocks.recentLikesRef.current["content-1"]).toBe(1);
    expect(result.current.likeCount).toBe(11);
  });
});
