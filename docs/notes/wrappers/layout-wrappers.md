# Layout client wrappers

Thin `"use client"` shells around context providers — mounted from [`app/layout.tsx`](../../../app/layout.tsx).

## Nesting (excerpt)

```tsx
<SessionProviderWrapper session={safeSession}>
  <CategTagsWrapper ...>
    <LikesWrapper>
      <NotificationsWrapper>
        <ReportsWrapper>
          <SuggestionsWrapper>
            ...
            <ToastProvider />  {/* from ToastWrapper.tsx */}
```

## `SessionProviderWrapper`

[`wrappers/SessionProviderWrapper.tsx`](../../../wrappers/SessionProviderWrapper.tsx)

```tsx
export type SessionProviderWrapperProps = {
  session: Session | null;
  children: ReactNode;
};
```

Passes `safeSession` from server `getServerSession` into `next-auth` `SessionProvider`.

## `ToastWrapper`

[`wrappers/ToastWrapper.tsx`](../../../wrappers/ToastWrapper.tsx) — default export is `ToastProvider` (`ToastContainer`). Imported in layout as `import ToastProvider from "@/wrappers/ToastWrapper"`.

## `ReportsWrapper` / `SuggestionsWrapper`

[`ReportsWrapper.tsx`](../../../wrappers/ReportsWrapper.tsx), [`SuggestionsWrapper.tsx`](../../../wrappers/SuggestionsWrapper.tsx) — mount `ReportsProvider` / `SuggestionsProvider`. Same pattern as [`LikesWrapper.tsx`](../../../wrappers/LikesWrapper.tsx) and [`NotificationWrapper.tsx`](../../../wrappers/NotificationWrapper.tsx).

`SuggestionsWrapper` retains commented-out prefetch sketch (not active).
