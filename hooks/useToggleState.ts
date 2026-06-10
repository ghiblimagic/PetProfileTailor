/**
 * Debounced optimistic toggle with rate limiting and rollback on API failure.
 * Notes: docs/notes/app/api/togglelike-route.md
 */
import { useState, useRef, useEffect } from "react";
import { debounce } from "@/utils/debounce";
import { useApiRateLimiter } from "./useApiRateLimiter";

export type UseToggleStateOptions<TRollback = unknown> = {
  initialActive: boolean;
  apiUrl: string;
  body: Record<string, unknown>;
  onApplyOptimistic?: (newLiked: boolean) => TRollback;
  onRollback?: (rollbackData: TRollback) => void;
};

export function useToggleState<TRollback = unknown>({
  initialActive,
  apiUrl,
  body,
  onApplyOptimistic, // custom function for optimistic updates
  onRollback, // custom function for rollback
}: UseToggleStateOptions<TRollback>) {
  const { canSend, registerSend } = useApiRateLimiter({
    limit: 3, // max requests allowed
    windowMs: 120000, // 2 minute window
  });

  const [active, setActive] = useState(initialActive);
  // ex was it initially like or not; true or false
  const [isProcessing, setIsProcessing] = useState(false);

  // keep track of last intended state (important if multiple toggles happen fast)
  const latestStateRef = useRef(initialActive);
  const rollbackRef = useRef<TRollback | undefined>(undefined);

  // debounced network commit with rate-limiting
  const debouncedCommit = useRef(
    debounce(async () => {
      const newState = latestStateRef.current;

      if (!canSend()) {
        console.warn("Rate limit reached, skipping API call");
        return;
      }

      try {
        setIsProcessing(true);
        await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        registerSend(); // only count successful sends, for rate limiting logic. We don't want to punish users for clicking multiple times, we just want to limit server load. However a truly spammy user could keep sending likes updates every time the timer ends in 2 minutes.
      } catch (err) {
        console.error("toggle error", err);
        setActive(!newState); // rollback UI
        if (rollbackRef.current !== undefined) {
          onRollback?.(rollbackRef.current);
        }
      } finally {
        setIsProcessing(false);
      }
    }, 500), //  debounce delay
  ).current;

  const toggle = async () => {
    if (isProcessing) return;

    const newState = !active;
    latestStateRef.current = newState;
    setActive(newState);

    // let parent hook manage how to optimistically update external refs/state
    rollbackRef.current = onApplyOptimistic?.(newState);
    debouncedCommit();
  };

  // flush pending request on unmount / tab close
  useEffect(() => {
    const flush = () => {
      if (!canSend()) {
        console.log("Rate limit reached, not sending request");
        return;
      }

      debouncedCommit.flush();
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      flush();
      window.removeEventListener("beforeunload", flush);
    };
  }, [debouncedCommit, canSend]);

  return { active, isProcessing, toggle };
}
