import { useState, useEffect, useRef } from "react";

type UseApiRateLimiterProps = {
  limit?: number;
  windowMs?: number;
};

export function useApiRateLimiter({
  limit = 5,
  windowMs = 2 * 60 * 1000,
}: UseApiRateLimiterProps) {
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setCount(0), windowMs);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [windowMs]);

  const canSend = () => count < limit;

  const registerSend = () => setCount((c) => c + 1);

  return { canSend, registerSend, count, limit };
}
