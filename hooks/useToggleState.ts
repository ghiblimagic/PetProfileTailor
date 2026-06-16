/**
 * Debounced optimistic toggle with rate limiting and rollback on API failure.
 *
 * Client contract (see docs/notes/app/api/togglelike-route.md):
 * - Every click updates optimistic UI immediately (active + onApplyOptimistic).
 * - latestStateRef holds the final intended liked state for the server.
 * - debouncedCommit resets a 500ms trailing timer on each click; POST fires
 *   500ms after the user stops clicking that button.
 * - Rate limit: block toggle before optimistic UI; show remainingSeconds cooldown.
 * - beforeunload / unmount flush() sends any pending debounced commit.
 *
 * Notes: docs/notes/app/api/togglelike-route.md
 */
import { useState, useRef, useEffect } from "react";
import { debounce } from "@/utils/debounce";
import { LIKE_TOGGLE_RATE_LIMIT } from "@/utils/api/likeToggleRateLimit";
import { useApiRateLimiter } from "./useApiRateLimiter";

export type UseToggleStateOptions<TRollback = unknown> = {
  initialActive: boolean;
  apiUrl: string;
  body: Record<string, unknown>;
  onApplyOptimistic?: (newLiked: boolean) => TRollback;
  onRollback?: (rollbackData: TRollback) => void;
};

type ToggleLikeErrorBody = {
  retryAfterSeconds?: number;
  message?: string;
};

export function useToggleState<TRollback = unknown>({
  initialActive,
  apiUrl,
  body,
  onApplyOptimistic,
  onRollback,
}: UseToggleStateOptions<TRollback>) {
  const {
    canSend,
    registerSend,
    applyServerCooldown,
    remainingSeconds,
    isRateLimited,
  } = useApiRateLimiter({
    limit: LIKE_TOGGLE_RATE_LIMIT.maxRequests,
    windowMs: LIKE_TOGGLE_RATE_LIMIT.windowMs,
  });

  const canSendRef = useRef(canSend);
  canSendRef.current = canSend;
  const registerSendRef = useRef(registerSend);
  registerSendRef.current = registerSend;
  const applyServerCooldownRef = useRef(applyServerCooldown);
  applyServerCooldownRef.current = applyServerCooldown;

  const [active, setActive] = useState(initialActive);
  const [isProcessing, setIsProcessing] = useState(false);

  const latestStateRef = useRef(initialActive);
  const rollbackRef = useRef<TRollback | undefined>(undefined);

  const debouncedCommit = useRef(
    debounce(async () => {
      const newState = latestStateRef.current;

      if (!canSendRef.current()) {
        return;
      }

      try {
        setIsProcessing(true);
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (response.status === 429) {
          let retryAfterSeconds = Math.ceil(
            LIKE_TOGGLE_RATE_LIMIT.windowMs / 1000,
          );
          try {
            const data = (await response.json()) as ToggleLikeErrorBody;
            if (typeof data.retryAfterSeconds === "number") {
              retryAfterSeconds = data.retryAfterSeconds;
            }
          } catch {
            // ignore malformed 429 body
          }
          applyServerCooldownRef.current(retryAfterSeconds);
          setActive(!newState);
          if (rollbackRef.current !== undefined) {
            onRollback?.(rollbackRef.current);
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`toggle failed: ${response.status}`);
        }

        registerSendRef.current();
      } catch (err) {
        console.error("toggle error", err);
        setActive(!newState);
        if (rollbackRef.current !== undefined) {
          onRollback?.(rollbackRef.current);
        }
      } finally {
        setIsProcessing(false);
      }
    }, 500),
  ).current;

  const toggle = async () => {
    if (isProcessing || !canSend()) {
      return;
    }

    const newState = !active;
    latestStateRef.current = newState;
    setActive(newState);

    rollbackRef.current = onApplyOptimistic?.(newState);
    debouncedCommit();
  };

  useEffect(() => {
    const flush = () => {
      if (!canSendRef.current()) {
        return;
      }

      debouncedCommit.flush();
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [debouncedCommit]);

  return {
    active,
    isProcessing,
    isRateLimited,
    remainingSeconds,
    toggle,
  };
}
