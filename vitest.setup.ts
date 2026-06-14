/** Deep design notes: docs/notes/vitest-setup.md */
import { TextDecoder, TextEncoder } from "util";
import "@testing-library/jest-dom/vitest";

Object.assign(global, { TextDecoder, TextEncoder });

// LoadingSpinner → usePrefersReducedMotions (jsdom only)
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
