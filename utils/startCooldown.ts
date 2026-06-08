import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

export default function startCooldown(
  intervalRef: MutableRefObject<ReturnType<typeof setInterval> | null>,
  setRemainingCooldown: Dispatch<SetStateAction<number>>,
  seconds = 5,
): void {
  if (intervalRef.current) return;
  setRemainingCooldown(seconds);

  intervalRef.current = setInterval(() => {
    setRemainingCooldown((prev) => {
      if (prev <= 1) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
}
