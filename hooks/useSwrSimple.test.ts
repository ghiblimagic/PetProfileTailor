import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useSWRSimple } from "./useSwrSimple";

const mocks = vi.hoisted(() => {
  const state = {
    getKey: null as
      | ((
          pageIndex: number,
          previousPageData: unknown[] | null,
        ) => string | null)
      | null,
    options: null as Record<string, unknown> | null,
    data: undefined as unknown[][] | undefined,
    error: undefined as unknown,
    isLoading: false,
    size: 1,
    setSize: vi.fn(),
    mutate: vi.fn(),
  };

  return {
    state,
    useSWRInfinite: vi.fn(
      (
        getKey: typeof state.getKey,
        _fetcher: unknown,
        options: Record<string, unknown>,
      ) => {
        state.getKey = getKey;
        state.options = options;
        return {
          data: state.data,
          error: state.error,
          isLoading: state.isLoading,
          size: state.size,
          setSize: state.setSize,
          mutate: state.mutate,
        };
      },
    ),
  };
});

vi.mock("swr/infinite", () => ({
  default: mocks.useSWRInfinite,
}));

function resetMocks(): void {
  mocks.state.data = undefined;
  mocks.state.error = undefined;
  mocks.state.isLoading = false;
  mocks.state.size = 1;
  mocks.state.getKey = null;
  mocks.state.options = null;
  mocks.useSWRInfinite.mockClear();
  mocks.state.setSize.mockClear();
  mocks.state.mutate.mockClear();
}

function renderSwrSimple(
  modelType: "thanks" | "names" | "descriptions" = "names",
  options: Parameters<typeof useSWRSimple>[1] = {},
) {
  return renderHook(() => useSWRSimple(modelType, options));
}

describe("useSWRSimple", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("getKey returns null when enabled is false", () => {
    renderSwrSimple("descriptions", { enabled: false });

    expect(mocks.state.getKey?.(0, null)).toBeNull();
    expect(mocks.state.getKey?.(1, [{ _id: "n1" }])).toBeNull();
  });

  it("getKey builds notification URL with page and limit", () => {
    renderSwrSimple("thanks");

    expect(mocks.state.getKey?.(0, null)).toBe(
      "/api/notifications/thanks?&page=1&limit=25",
    );
    expect(mocks.state.getKey?.(2, [{ _id: "a" }, { _id: "b" }])).toBe(
      "/api/notifications/thanks?&page=3&limit=25",
    );
  });

  it("getKey returns null when previous page was empty (end of list)", () => {
    renderSwrSimple("names");

    expect(mocks.state.getKey?.(1, [])).toBeNull();
  });

  it("flattens paginated SWR data into SWRNotifications", () => {
    mocks.state.data = [
      [{ _id: "n1" }, { _id: "n2" }],
      [{ _id: "n3" }],
    ];

    const { result } = renderSwrSimple("names");

    expect(result.current.SWRNotifications).toEqual([
      { _id: "n1" },
      { _id: "n2" },
      { _id: "n3" },
    ]);
  });

  it("SWRisReachingEnd is true when the last page is shorter than PAGE_SIZE", () => {
    mocks.state.data = [Array.from({ length: 25 }, (_, i) => ({ _id: `n${i}` }))];

    const { result: fullPage } = renderSwrSimple("names");
    expect(fullPage.current.SWRisReachingEnd).toBe(false);

    resetMocks();
    mocks.state.data = [
      Array.from({ length: 25 }, (_, i) => ({ _id: `n${i}` })),
      [{ _id: "last" }],
    ];

    const { result: partialLast } = renderSwrSimple("names");
    expect(partialLast.current.SWRisReachingEnd).toBe(true);
  });

  it("passes initialPage as SWR fallbackData", () => {
    const initialPage = [{ _id: "ssr-1" }];

    renderSwrSimple("names", { initialPage });

    expect(mocks.state.options?.fallbackData).toEqual([initialPage]);
  });

  it("forwards loading, error, size, setSize, and mutate from SWR", () => {
    const mutate = vi.fn();
    mocks.state.data = [];
    mocks.state.error = new Error("network");
    mocks.state.isLoading = true;
    mocks.state.size = 2;
    mocks.state.setSize = vi.fn();
    mocks.state.mutate = mutate;

    const { result } = renderSwrSimple("names", {
      revalidateOnMount: false,
      revalidateIfStale: false,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toEqual(new Error("network"));
    expect(result.current.size).toBe(2);
    expect(result.current.setSize).toBe(mocks.state.setSize);
    expect(result.current.mutate).toBe(mutate);
    expect(mocks.state.options?.revalidateOnMount).toBe(false);
    expect(mocks.state.options?.revalidateIfStale).toBe(false);
  });
});
