import { act, renderHook } from "@testing-library/react";
import type { SetStateAction } from "react";
import { vi } from "vitest";
import {
  applyOptimisticDeleteToContent,
  removeDeletedItemFromSwrPages,
  useDeleteConfirmation,
} from "./useDeleteConfirmation";

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("removeDeletedItemFromSwrPages", () => {
  it("removes the target id from each page and decrements totalDocs", () => {
    const pages = [
      {
        data: [{ _id: "a" }, { _id: "b" }],
        totalDocs: 5,
      },
      {
        data: [{ _id: "b" }, { _id: "c" }],
        totalDocs: 3,
      },
    ];

    const result = removeDeletedItemFromSwrPages(pages, "b");

    expect(result[0].data).toEqual([{ _id: "a" }]);
    expect(result[0].totalDocs).toBe(4);
    expect(result[1].data).toEqual([{ _id: "c" }]);
    expect(result[1].totalDocs).toBe(2);
  });

  it("uses page.data.length when totalDocs is missing", () => {
    const pages = [{ data: [{ _id: "only" }] }];

    const result = removeDeletedItemFromSwrPages(pages, "only");

    expect(result[0].data).toEqual([]);
    expect(result[0].totalDocs).toBe(0);
  });
});

describe("applyOptimisticDeleteToContent", () => {
  it("marks matching content DELETED and leaves other rows unchanged", () => {
    expect(
      applyOptimisticDeleteToContent(
        { _id: "x", content: "Hello" },
        "x",
      ),
    ).toEqual({ _id: "x", content: "DELETED" });

    expect(
      applyOptimisticDeleteToContent(
        { _id: "y", content: "Hello" },
        "x",
      ),
    ).toEqual({ _id: "y", content: "Hello" });
  });
});

describe("useDeleteConfirmation", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("confirmDelete applies optimistic SWR updater before fetch", async () => {
    const customMutate = vi.fn();

    const { result } = renderHook(() => useDeleteConfirmation());

    act(() => {
      result.current.openDelete({ _id: "item-1", content: "Hello" });
    });

    await act(async () => {
      await result.current.confirmDelete(
        "/api/names/delete/item-1",
        "user-1",
        customMutate,
      );
    });

    expect(customMutate).toHaveBeenCalled();
    const updater = customMutate.mock.calls[0][0] as (
      pages?: { data: { _id: string }[]; totalDocs?: number }[],
    ) => { data: { _id: string }[]; totalDocs?: number }[];

    expect(
      updater([
        {
          data: [{ _id: "item-1" }, { _id: "item-2" }],
          totalDocs: 2,
        },
      ]),
    ).toEqual([
      {
        data: [{ _id: "item-2" }],
        totalDocs: 1,
      },
    ]);
  });

  it("confirmDelete revalidates SWR after successful delete", async () => {
    const customMutate = vi.fn();

    const { result } = renderHook(() => useDeleteConfirmation());

    act(() => {
      result.current.openDelete({ _id: "item-1" });
    });

    await act(async () => {
      await result.current.confirmDelete(
        "/api/names/delete/item-1",
        "user-1",
        customMutate,
      );
    });

    expect(customMutate).toHaveBeenCalledTimes(2);
    expect(customMutate.mock.calls[1][0]).toBeUndefined();
  });

  it("confirmDelete rolls back SWR cache on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    const customMutate = vi.fn();

    const { result } = renderHook(() => useDeleteConfirmation());

    act(() => {
      result.current.openDelete({ _id: "item-1", content: "Hello" });
    });

    await act(async () => {
      await result.current.confirmDelete(
        "/api/names/delete/item-1",
        "user-1",
        customMutate,
      );
    });

    expect(customMutate).toHaveBeenCalledTimes(2);
    expect(customMutate.mock.calls[1][0]).toBeUndefined();
  });

  it("confirmDelete marks standalone local content DELETED optimistically", async () => {
    type ContentRow = { _id: string; content: string };
    let localContent: ContentRow = { _id: "item-1", content: "Hello" };
    const setLocalData = vi.fn((updater: SetStateAction<ContentRow>) => {
      localContent =
        typeof updater === "function" ? updater(localContent) : updater;
    });

    const { result } = renderHook(() => useDeleteConfirmation());

    act(() => {
      result.current.openDelete({ _id: "item-1", content: "Hello" });
    });

    await act(async () => {
      await result.current.confirmDelete(
        "/api/names/delete/item-1",
        "user-1",
        undefined,
        setLocalData,
      );
    });

    expect(setLocalData).toHaveBeenCalled();
    expect(localContent).toEqual({ _id: "item-1", content: "DELETED" });
  });

  it("confirmDelete rolls back local content on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    type ContentRow = { _id: string; content: string };
    let localContent: ContentRow = { _id: "item-1", content: "Hello" };
    const setLocalData = vi.fn((updater: SetStateAction<ContentRow>) => {
      localContent =
        typeof updater === "function" ? updater(localContent) : updater;
    });

    const { result } = renderHook(() => useDeleteConfirmation());

    act(() => {
      result.current.openDelete({ _id: "item-1", content: "Hello" });
    });

    await act(async () => {
      await result.current.confirmDelete(
        "/api/names/delete/item-1",
        "user-1",
        undefined,
        setLocalData,
      );
    });

    expect(localContent).toEqual({ _id: "item-1", content: "Hello" });
  });
});
