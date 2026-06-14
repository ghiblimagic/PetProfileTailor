# Small UI components

## `LoadingSpinner`

Source: [`components/shared/ui/LoadingSpinner.tsx`](../../../components/shared/ui/LoadingSpinner.tsx)

Centered loading state used across forms, listings, and embeds.

```tsx
"use client";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotions";

export default function LoadingSpinner() {
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <div className="flex items-center justify-center py-20">
      {prefersReducedMotion ? (
        <p className="text-white"> Loading ...</p>
      ) : (
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
      )}
    </div>
  );
}
```

### Special behavior

- **`use client`** — uses `usePrefersReducedMotion`.
- Respects **prefers-reduced-motion**: static text instead of spinning border.
- No props — drop-in overlay inside parent layouts.

## `MustLoginMessage`

Source: [`components/shared/feedback/MustLoginMessage.tsx`](../../../components/shared/feedback/MustLoginMessage.tsx)

Red banner for gated actions (reports, suggestions, thanks, etc.).

```tsx
export type MustLoginMessageProps = { text: string };

export default function MustLoginMessage({ text }: MustLoginMessageProps) {
  return (
    <div className="bg-red-900 p-2 text-subtleWhite font-bold border-2 border-yellow-300 ...">
      {`To avoid spam, users must sign in to ${text}`}
    </div>
  );
}
```

### Usage

```tsx
{!signedInUser && <MustLoginMessage text="submit a report" />}
```

`text` is the verb phrase after “sign in to” — not a full sentence.

## `Skeleton`

Source: [`components/shared/ui/skeleton.tsx`](../../../components/shared/ui/skeleton.tsx)

Pulse placeholder for loading layouts (shadcn-style primitive).
