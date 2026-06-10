/**
 * Client-side cooldown via localStorage — rate-limit repeat clicks (e.g. recheck, magic link).
 */
import { useState, useEffect } from "react";

export type UseLocalStorageCooldownReturn = {
  canClick: boolean;
  timer: number;
  formattedTimer: string;
  /** Returns true when click is allowed and cooldown was started. */
  trigger: () => boolean;
};

export function useLocalStorageCooldown(
  key: string,
  duration = 120,
): UseLocalStorageCooldownReturn {
  const [canClick, setCanClick] = useState(false); //default as false to avoid a flash of it being enabled before it reads from localStorage
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return; // server guard
    const now = Date.now();
    const lastClicked = parseInt(localStorage.getItem(key) || "0", 10);
    const elapsed = Math.floor((now - lastClicked) / 1000);

    if (elapsed < duration) {
      setCanClick(false);
      setTimer(duration - elapsed);
    } else {
      localStorage.removeItem(key);
      setCanClick(true);
      setTimer(0);
    }
  }, [key, duration]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          localStorage.removeItem(key);
          setCanClick(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, key]);

  const trigger = (): boolean => {
    if (!canClick) return false;
    localStorage.setItem(key, Date.now().toString());
    setCanClick(false);
    setTimer(duration);
    return true;
  };

  const formattedTimer = `${Math.floor(timer / 60)}m:${String(
    timer % 60,
  ).padStart(2, "0")}s`;

  return { canClick, timer, formattedTimer, trigger };
}
