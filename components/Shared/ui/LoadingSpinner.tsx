/**
 * Centered loading indicator with reduced-motion fallback.
 * Notes: docs/notes/components/ui/small-ui-components.md
 */
"use client";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotions";

export default function LoadingSpinner() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="flex items-center justify-center py-20">
      {prefersReducedMotion ? (
        <p className="text-white"> Loading ...</p>
      ) : (
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      )}
    </div>
  );
}
