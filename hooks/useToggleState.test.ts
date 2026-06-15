import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useToggleState } from "./useToggleState";

const mocks = vi.hoisted(() => ({
  canSend: vi.fn(() => true),
  registerSend: vi.fn(),
}));

vi.mock("./useApiRateLimiter", () => ({
  useApiRateLimiter: () => ({
    canSend: mocks.canSend,
    registerSend: mocks.registerSend,
    count: 0,
    limit: 3,
  }),
}));

const API_URL = "http://localhost/api/names/likes/item-1/togglelike";

const defaultOptions = {
  initialActive: false,
  apiUrl: API_URL,
  body: { contentCreator: { _id: "creator-1" } },
};

describe("useToggleState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.canSend.mockReturnValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function advanceDebounce() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
  }

  it("flips active optimistically on toggle", async () => {
    const { result } = renderHook(() => useToggleState(defaultOptions));

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.active).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("POSTs after debounce and calls registerSend on success", async () => {
    const { result } = renderHook(() => useToggleState(defaultOptions));

    await act(async () => {
      await result.current.toggle();
    });
    await advanceDebounce();

    expect(fetch).toHaveBeenCalledWith(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(defaultOptions.body),
    });
    expect(mocks.registerSend).toHaveBeenCalledTimes(1);
    expect(result.current.active).toBe(true);
    expect(result.current.isProcessing).toBe(false);
  });

  it("calls onApplyOptimistic when toggling", async () => {
    const onApplyOptimistic = vi.fn(() => "rollback-token");
    const { result } = renderHook(() =>
      useToggleState({ ...defaultOptions, onApplyOptimistic }),
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(onApplyOptimistic).toHaveBeenCalledWith(true);
  });

  it("rolls back active and calls onRollback when fetch fails", async () => {
    const onRollback = vi.fn();
    const onApplyOptimistic = vi.fn(() => "rollback-token");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() =>
      useToggleState({
        ...defaultOptions,
        onApplyOptimistic,
        onRollback,
      }),
    );

    await act(async () => {
      await result.current.toggle();
    });
    await advanceDebounce();

    expect(result.current.active).toBe(false);
    expect(onRollback).toHaveBeenCalledWith("rollback-token");
    expect(mocks.registerSend).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("skips API call when rate limit blocks send", async () => {
    mocks.canSend.mockReturnValue(false);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() => useToggleState(defaultOptions));

    await act(async () => {
      await result.current.toggle();
    });
    await advanceDebounce();

    expect(fetch).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      "Rate limit reached, skipping API call",
    );

    warnSpy.mockRestore();
  });

  it("ignores toggle while a commit is in flight", async () => {
    let resolveFetch!: () => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = () => resolve({ ok: true } as Response);
        }),
    );

    const onApplyOptimistic = vi.fn(() => 0);
    const { result } = renderHook(() =>
      useToggleState({ ...defaultOptions, onApplyOptimistic }),
    );

    await act(async () => {
      await result.current.toggle();
    });
    await advanceDebounce();

    expect(result.current.isProcessing).toBe(true);

    await act(async () => {
      await result.current.toggle();
    });

    expect(onApplyOptimistic).toHaveBeenCalledTimes(1);
    expect(result.current.active).toBe(true);

    await act(async () => {
      resolveFetch();
      await Promise.resolve();
    });

    expect(result.current.isProcessing).toBe(false);
  });
});
