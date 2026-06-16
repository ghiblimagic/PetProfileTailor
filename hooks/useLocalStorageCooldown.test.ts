import { act, renderHook, waitFor } from "@testing-library/react";
import { useLocalStorageCooldown } from "./useLocalStorageCooldown";

const KEY = "test-cooldown-key";

describe("useLocalStorageCooldown", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("allows clicks when no prior cooldown exists", async () => {
    const { result } = renderHook(() => useLocalStorageCooldown(KEY, 120));

    await waitFor(() => {
      expect(result.current.canClick).toBe(true);
    });
    expect(result.current.timer).toBe(0);
  });

  it("blocks clicks when cooldown is still active in localStorage", async () => {
    localStorage.setItem(KEY, String(Date.now() - 30_000));

    const { result } = renderHook(() => useLocalStorageCooldown(KEY, 120));

    await waitFor(() => {
      expect(result.current.canClick).toBe(false);
    });
    expect(result.current.timer).toBe(90);
  });

  it("trigger starts cooldown and returns false while blocked", async () => {
    const { result } = renderHook(() => useLocalStorageCooldown(KEY, 5));

    await waitFor(() => {
      expect(result.current.canClick).toBe(true);
    });

    let started = false;
    act(() => {
      started = result.current.trigger();
    });

    expect(started).toBe(true);
    expect(result.current.canClick).toBe(false);
    expect(result.current.timer).toBe(5);
    expect(localStorage.getItem(KEY)).toBeTruthy();

    act(() => {
      expect(result.current.trigger()).toBe(false);
    });
  });

  it("counts down and re-enables clicks after duration", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLocalStorageCooldown(KEY, 3));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.canClick).toBe(true);

    act(() => {
      result.current.trigger();
    });

    expect(result.current.timer).toBe(3);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.canClick).toBe(true);
    expect(result.current.timer).toBe(0);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("formats timer as m:ss", async () => {
    localStorage.setItem(KEY, String(Date.now() - 65_000));

    const { result } = renderHook(() => useLocalStorageCooldown(KEY, 120));

    await waitFor(() => {
      expect(result.current.formattedTimer).toBe("0m:55s");
    });
  });
});
