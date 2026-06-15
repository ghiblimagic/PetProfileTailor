import { act, renderHook } from "@testing-library/react";
import { useApiRateLimiter } from "./useApiRateLimiter";

const WINDOW_MS = 60_000;
const LIMIT = 3;

describe("useApiRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows sends while count is below the limit", () => {
    const { result } = renderHook(() =>
      useApiRateLimiter({ limit: LIMIT, windowMs: WINDOW_MS }),
    );

    expect(result.current.count).toBe(0);
    expect(result.current.limit).toBe(LIMIT);
    expect(result.current.canSend()).toBe(true);
  });

  it("blocks sends after the limit is reached", () => {
    const { result } = renderHook(() =>
      useApiRateLimiter({ limit: LIMIT, windowMs: WINDOW_MS }),
    );

    act(() => {
      result.current.registerSend();
      result.current.registerSend();
      result.current.registerSend();
    });

    expect(result.current.count).toBe(LIMIT);
    expect(result.current.canSend()).toBe(false);
  });

  it("resets count after the window interval elapses", () => {
    const { result } = renderHook(() =>
      useApiRateLimiter({ limit: LIMIT, windowMs: WINDOW_MS }),
    );

    act(() => {
      result.current.registerSend();
      result.current.registerSend();
      result.current.registerSend();
    });

    expect(result.current.canSend()).toBe(false);

    act(() => {
      vi.advanceTimersByTime(WINDOW_MS);
    });

    expect(result.current.count).toBe(0);
    expect(result.current.canSend()).toBe(true);
  });

  it("uses default limit and window when options are omitted", () => {
    const { result } = renderHook(() => useApiRateLimiter({}));

    expect(result.current.limit).toBe(5);

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.registerSend();
      }
    });

    expect(result.current.canSend()).toBe(false);
  });
});
