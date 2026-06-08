import { useRef, useState } from "react";
import { act, renderHook } from "@testing-library/react";
import startCooldown from "./startCooldown";

describe("startCooldown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("counts down and clears the interval at zero", () => {
    const { result } = renderHook(() => {
      const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
      const [remaining, setRemaining] = useState(0);
      return { intervalRef, remaining, setRemaining };
    });

    act(() => {
      startCooldown(result.current.intervalRef, result.current.setRemaining, 3);
    });

    expect(result.current.remaining).toBe(3);
    expect(result.current.intervalRef.current).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(2);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.remaining).toBe(0);
    expect(result.current.intervalRef.current).toBeNull();
  });

  it("does not start a second interval when one is already running", () => {
    const { result } = renderHook(() => {
      const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
      const [remaining, setRemaining] = useState(0);
      return { intervalRef, remaining, setRemaining };
    });

    act(() => {
      startCooldown(result.current.intervalRef, result.current.setRemaining, 5);
    });
    const firstInterval = result.current.intervalRef.current;

    act(() => {
      startCooldown(result.current.intervalRef, result.current.setRemaining, 10);
    });

    expect(result.current.intervalRef.current).toBe(firstInterval);
    expect(result.current.remaining).toBe(5);
  });
});
