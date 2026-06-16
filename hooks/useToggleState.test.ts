import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useToggleState } from "./useToggleState";

const mocks = vi.hoisted(() => ({
  canSend: vi.fn(() => true),
  registerSend: vi.fn(),
  applyServerCooldown: vi.fn(),
}));

vi.mock("./useApiRateLimiter", () => ({
  useApiRateLimiter: () => ({
    canSend: mocks.canSend,
    registerSend: mocks.registerSend,
    applyServerCooldown: mocks.applyServerCooldown,
    count: 0,
    limit: 3,
    remainingSeconds: 0,
    isRateLimited: false,
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

  it("does not apply optimistic update when rate limit blocks toggle", async () => {
    mocks.canSend.mockReturnValue(false);

    const { result } = renderHook(() => useToggleState(defaultOptions));

    await act(async () => {
      await result.current.toggle();
    });
    await advanceDebounce();

    expect(result.current.active).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rolls back and applies server cooldown on 429", async () => {
    const onRollback = vi.fn();
    const onApplyOptimistic = vi.fn(() => "rollback-token");
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ retryAfterSeconds: 90 }),
    } as Response);

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
    expect(mocks.applyServerCooldown).toHaveBeenCalledWith(90);
    expect(mocks.registerSend).not.toHaveBeenCalled();
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

  it("coalesces multiple rapid toggles into one POST with final state", async () => {
    const { result } = renderHook(() => useToggleState(defaultOptions));

    await act(async () => {
      await result.current.toggle();
      await result.current.toggle();
      await result.current.toggle();
    });

    expect(result.current.active).toBe(true);
    expect(fetch).not.toHaveBeenCalled();

    await advanceDebounce();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.current.active).toBe(true);
  });

  it("does not flush pending debounce on optimistic re-render", async () => {
    const { result, rerender } = renderHook(() =>
      useToggleState(defaultOptions),
    );

    await act(async () => {
      await result.current.toggle();
    });
    rerender();
    await advanceDebounce();

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("like then unlike before settle sends one POST with final unlike state", async () => {
    const { result } = renderHook(() => useToggleState(defaultOptions));

    await act(async () => {
      await result.current.toggle();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.active).toBe(false);
    expect(fetch).not.toHaveBeenCalled();

    await advanceDebounce();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.current.active).toBe(false);
  });

  it("separate bursts separated by 500ms send multiple POSTs", async () => {
    const { result } = renderHook(() => useToggleState(defaultOptions));

    await act(async () => {
      await result.current.toggle();
    });
    await advanceDebounce();
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.toggle();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    await advanceDebounce();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.current.active).toBe(false);
  });
});
