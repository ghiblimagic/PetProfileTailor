type DebouncedFunction<T extends (...args: never[]) => unknown> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
  flush: () => void;
};

export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  delay = 500,
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  function debounced(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    lastArgs = args;
    timeout = setTimeout(() => {
      if (lastArgs) {
        fn(...lastArgs);
      }
      timeout = null;
      lastArgs = null;
    }, delay);
  }

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timeout && lastArgs) {
      clearTimeout(timeout);
      fn(...lastArgs);
      timeout = null;
      lastArgs = null;
    }
  };

  return debounced;
}
