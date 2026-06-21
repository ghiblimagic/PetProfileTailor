import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import type { ContentListingItem } from "@/components/ShowingListOfContent/ContentListing";
import {
  buildSwrPaginationGetKey,
  shouldSkipSwrPaginationForLikes,
  swrPaginationFetcher,
  useSwrPagination,
  type SwrPage,
} from "./useSwrPagination";

function mockListingItem(
  overrides: Partial<ContentListingItem> = {},
): ContentListingItem {
  return {
    _id: "item-1",
    content: "Test content",
    tags: [],
    likedByCount: 0,
    createdBy: { _id: "user-1" },
    ...overrides,
  };
}

const mocks = vi.hoisted(() => {
  const state = {
    getKey: null as
      | ((pageIndex: number, previousPageData: SwrPage | null) => unknown)
      | null,
    getLikedIds: vi.fn(() => [] as string[]),
    data: undefined as SwrPage[] | undefined,
  };

  return {
    state,
    useSWRInfinite: vi.fn((getKey: typeof state.getKey) => {
      state.getKey = getKey;
      return {
        data: state.data,
        error: undefined,
        isLoading: false,
        isValidating: false,
        size: 1,
        setSize: vi.fn(),
        mutate: vi.fn(),
      };
    }),
  };
});

vi.mock("swr/infinite", () => ({
  default: mocks.useSWRInfinite,
}));

vi.mock("@/context/LikesContext", () => ({
  useLikes: () => ({
    getLikedIds: mocks.state.getLikedIds,
  }),
}));

const baseParams = {
  sortingProperty: "createdAt",
  sortingValue: -1,
};

describe("shouldSkipSwrPaginationForLikes", () => {
  it("skips when restricted and likedIds is null or empty", () => {
    expect(shouldSkipSwrPaginationForLikes(true, null)).toBe(true);
    expect(shouldSkipSwrPaginationForLikes(true, [])).toBe(true);
  });

  it("does not skip when unrestricted or likes exist", () => {
    expect(shouldSkipSwrPaginationForLikes(false, [])).toBe(false);
    expect(shouldSkipSwrPaginationForLikes(true, ["id-1"])).toBe(false);
  });
});

describe("buildSwrPaginationGetKey", () => {
  it("returns null when the previous page had no rows", () => {
    expect(
      buildSwrPaginationGetKey(1, { data: [] }, {
        dataType: "names",
        ...baseParams,
      }),
    ).toBeNull();
  });

  it("builds names URL with 1-based page index", () => {
    expect(
      buildSwrPaginationGetKey(0, null, {
        dataType: "names",
        ...baseParams,
      }),
    ).toEqual([
      "/api/names/swr?page=1&sortingproperty=createdAt&sortingvalue=-1",
      {},
    ]);

    expect(
      buildSwrPaginationGetKey(2, { data: [mockListingItem({ _id: "n1" })] }, {
        dataType: "names",
        ...baseParams,
      }),
    ).toEqual([
      "/api/names/swr?page=3&sortingproperty=createdAt&sortingvalue=-1",
      {},
    ]);
  });

  it("builds descriptions URL", () => {
    const key = buildSwrPaginationGetKey(0, null, {
      dataType: "descriptions",
      sortingProperty: "content",
      sortingValue: 1,
    });

    expect(key).toEqual([
      "/api/description/swr?page=1&sortingproperty=content&sortingvalue=1",
      {},
    ]);
  });

  it("includes POST body when tags, profileUserId, or likedIds are set", () => {
    expect(
      buildSwrPaginationGetKey(0, null, {
        dataType: "names",
        ...baseParams,
        tags: ["tag-a"],
        profileUserId: "user-1",
      }),
    ).toEqual([
      "/api/names/swr?page=1&sortingproperty=createdAt&sortingvalue=-1",
      {
        body: {
          tags: ["tag-a"],
          profileUserId: "user-1",
        },
      },
    ]);

    expect(
      buildSwrPaginationGetKey(0, null, {
        dataType: "names",
        ...baseParams,
        likedIds: ["like-1", "like-2"],
      }),
    ).toEqual([
      "/api/names/swr?page=1&sortingproperty=createdAt&sortingvalue=-1",
      { body: { likedIds: ["like-1", "like-2"] } },
    ]);

    expect(
      buildSwrPaginationGetKey(0, null, {
        dataType: "names",
        ...baseParams,
        likedIds: null,
      }),
    ).toEqual([
      "/api/names/swr?page=1&sortingproperty=createdAt&sortingvalue=-1",
      { body: { likedIds: null } },
    ]);
  });

  it("omits likedIds from body when the array is empty", () => {
    expect(
      buildSwrPaginationGetKey(0, null, {
        dataType: "names",
        ...baseParams,
        likedIds: [],
      }),
    ).toEqual([
      "/api/names/swr?page=1&sortingproperty=createdAt&sortingvalue=-1",
      {},
    ]);
  });
});

describe("swrPaginationFetcher", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], totalDocs: 0 }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses GET for a plain URL key", async () => {
    await swrPaginationFetcher("/api/names/swr?page=1");

    expect(fetchMock).toHaveBeenCalledWith("/api/names/swr?page=1", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: undefined,
    });
  });

  it("uses GET when the tuple has an empty options object", async () => {
    await swrPaginationFetcher(["/api/names/swr?page=1", {}]);

    expect(fetchMock).toHaveBeenCalledWith("/api/names/swr?page=1", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: undefined,
    });
  });

  it("uses POST with JSON body when filters are present", async () => {
    await swrPaginationFetcher([
      "/api/names/swr?page=1",
      { body: { tags: ["e2e-tag"], likedIds: ["id-1"] } },
    ]);

    expect(fetchMock).toHaveBeenCalledWith("/api/names/swr?page=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: ["e2e-tag"], likedIds: ["id-1"] }),
    });
  });
});

describe("useSwrPagination", () => {
  beforeEach(() => {
    mocks.state.data = undefined;
    mocks.state.getKey = null;
    mocks.state.getLikedIds.mockReturnValue([]);
    mocks.useSWRInfinite.mockClear();
  });

  it("returns empty result when liked-names filter has no likes", () => {
    mocks.state.getLikedIds.mockReturnValue([]);

    const { result } = renderHook(() =>
      useSwrPagination({
        dataType: "names",
        currentUiPage: 1,
        itemsPerUiPage: 10,
        restrictSwrToLikedNames: true,
      }),
    );

    expect(result.current.data).toEqual([]);
    expect(mocks.useSWRInfinite).not.toHaveBeenCalled();
  });

  it("wires buildSwrPaginationGetKey through SWR infinite getKey", () => {
    renderHook(() =>
      useSwrPagination({
        dataType: "names",
        currentUiPage: 1,
        itemsPerUiPage: 10,
        tags: ["e2e-tag"],
      }),
    );

    expect(mocks.state.getKey?.(0, null)).toEqual([
      "/api/names/swr?page=1&sortingproperty=undefined&sortingvalue=undefined",
      { body: { tags: ["e2e-tag"] } },
    ]);
  });

  it("flattens SWR pages and computes total pages", () => {
    mocks.state.data = [
      {
        data: [
          mockListingItem({ _id: "a" }),
          mockListingItem({ _id: "b" }),
        ],
        totalDocs: 25,
      },
      { data: [mockListingItem({ _id: "c" })] },
    ];

    const { result } = renderHook(() =>
      useSwrPagination({
        dataType: "names",
        currentUiPage: 1,
        itemsPerUiPage: 10,
      }),
    );

    expect(result.current.data).toEqual([
      mockListingItem({ _id: "a" }),
      mockListingItem({ _id: "b" }),
      mockListingItem({ _id: "c" }),
    ]);
    expect(result.current.totalItems).toBe(25);
    expect(result.current.totalPagesInDatabase).toBe(3);
  });
});
