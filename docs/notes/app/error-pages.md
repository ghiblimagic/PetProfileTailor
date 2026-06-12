# Error pages

Sources:

- [`app/not-found.tsx`](../../../app/not-found.tsx)
- [`app/global-error.tsx`](../../../app/global-error.tsx)
- [`components/Contact/ErrorContactMessage.tsx`](../../../components/Contact/ErrorContactMessage.tsx)

## not-found

Custom 404 with gif/png swap via `usePrefersReducedMotion` + hover.

## global-error

Root error boundary — **must** be a client component and include `<html>` + `<body>`. Accepts `error` and `reset` (typed; UI unchanged).

 need to mark it as useClient, because of the way Next passes errors to this component Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". <... buildId=... assetPrefix="" initialCanonicalUrl=... initialTree=... initialHead=... globalErrorComponent={function} children=...>

## ErrorContactMessage

Shared contact CTA used by 404 and global error.
