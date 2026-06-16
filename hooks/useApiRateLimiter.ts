import { useState, useEffect, useRef, useCallback } from "react";

type UseApiRateLimiterProps = {
  limit?: number;
  windowMs?: number;
};

function secondsUntilReset(resetTime: number, now: number): number {
  return Math.max(0, Math.ceil((resetTime - now) / 1000));
}

export function useApiRateLimiter({
  limit = 5,
  windowMs = 2 * 60 * 1000,
}: UseApiRateLimiterProps = {}) {
  const countRef = useRef(0);
  const resetTimeRef = useRef(0);
  const [count, setCount] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const refreshRemainingSeconds = useCallback(() => {
    const now = Date.now();
    if (resetTimeRef.current > 0 && now > resetTimeRef.current) {
      countRef.current = 0;
      resetTimeRef.current = 0;
      setCount(0);
      setRemainingSeconds(0);
      return;
    }
    if (countRef.current >= limit && resetTimeRef.current > now) {
      setRemainingSeconds(secondsUntilReset(resetTimeRef.current, now));
    } else {
      setRemainingSeconds(0);
    }
  }, [limit]);

  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const interval = setInterval(refreshRemainingSeconds, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds, refreshRemainingSeconds]);

  const canSend = useCallback(() => {
    const now = Date.now();
    if (resetTimeRef.current > 0 && now > resetTimeRef.current) {
      countRef.current = 0;
      resetTimeRef.current = 0;
      setCount(0);
      setRemainingSeconds(0);
      return true;
    }
    return countRef.current < limit;
  }, [limit]);

  const registerSend = useCallback(() => {
    const now = Date.now();
    if (resetTimeRef.current === 0 || now > resetTimeRef.current) {
      resetTimeRef.current = now + windowMs;
      countRef.current = 1;
    } else {
      countRef.current += 1;
    }
    setCount(countRef.current);
    if (countRef.current >= limit) {
      setRemainingSeconds(secondsUntilReset(resetTimeRef.current, now));
    }
  }, [limit, windowMs]);

  /** Sync client cooldown after server 429 (e.g. multi-tab or direct API). */
  const applyServerCooldown = useCallback(
    (retryAfterSeconds: number) => {
      const seconds = Math.max(1, Math.ceil(retryAfterSeconds));
      resetTimeRef.current = Date.now() + seconds * 1000;
      countRef.current = limit;
      setCount(limit);
      setRemainingSeconds(seconds);
    },
    [limit],
  );

  return {
    canSend,
    registerSend,
    applyServerCooldown,
    count,
    limit,
    remainingSeconds,
    isRateLimited: remainingSeconds > 0,
  };
}
