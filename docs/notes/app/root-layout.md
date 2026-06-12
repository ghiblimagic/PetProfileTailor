# Root layout

Source: [`app/layout.tsx`](../../../app/layout.tsx)

## Role

Server root layout for every page: metadata, session, nested client wrappers (categories/tags, likes, notifications, reports, suggestions), nav header, `Suspense` main, footer, analytics, toasts.

## Metadata

```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://homewardtails.com"),
  title: "Improve Adoption Rates by Creating Impactful, Fun, and Tailor-Fitted Pet Adoption Profiles!",
  description: "Homeward Tails is a community powered database ...",
  icons: { icon: "/icon.png" },
};
```

## Provider nesting (outer → inner)

```tsx
<SessionProviderWrapper session={safeSession}>
  <CategTagsWrapper descrCateg={descriptions} nameCateg={names}>
    <LikesWrapper>
      <NotificationsWrapper>
        <ReportsWrapper>
          <SuggestionsWrapper>
            <header><NavLayoutwithSettingsMenu /></header>
            <Suspense fallback={<LoadingSkeleton />}>
              <main>{children}<GoToTopButton top="280" /></main>
            </Suspense>
            <Analytics />
            <ToastProvider />
            <Footer />
          </SuggestionsWrapper>
        </ReportsWrapper>
      </NotificationsWrapper>
    </LikesWrapper>
  </CategTagsWrapper>
</SessionProviderWrapper>
```

### Special behavior: wrappers vs providers (from source comments)

> empty wrappers are needed for the providers, since providers need to be inside a client component to safely run hooks even with having "use client" at the top of the provider  
> Otherwise the app will fail if the provider is directly placed here, since the layout is a server component  
> wrappers are a client component what wraps the provider and {children} so the provider can safely run hooks.  
> Server layout: stays server component, just renders wrappers around {children}.

## Session

```ts
const session = await getServerSession(serverAuthOptions);
const safeSession: Session | null = session
  ? {
      ...session,
      user: session.user || ({} as Session["user"]),
    }
  : null;
// Guarantees session.user exists (or is an empty object).
```

Passed to [`SessionProviderWrapper`](../../../wrappers/SessionProviderWrapper.tsx) → `next-auth` `SessionProvider`. See [layout-wrappers.md](../wrappers/layout-wrappers.md).

## Categories TTL cache (`getCategoriesAndTagsWithTTL`)

In-memory module cache — **3 hours**, same query as [`/api/categories-and-tags`](../../../app/api/categories-and-tags/route.ts) (API uses Next `revalidate = 10800` instead).

```ts
// 🧠 3-hour TTL cache
let cachedCategories: CachedCategories | null = null;
let lastFetched = 0;

async function getCategoriesAndTagsWithTTL(): Promise<CachedCategories> {
  const THREE_HOURS = 3 * 60 * 60 * 1000;
  if (cachedCategories && Date.now() - lastFetched < THREE_HOURS) {
    return cachedCategories;
  }

  await dbConnect.connect();

  const [nameCategories, descCategories] = await Promise.all([
    leanWithStrings(NameCategory.find().populate("tags").sort({ order: 1 })),
    leanWithStrings(
      DescriptionCategory.find().populate("tags").sort({ order: 1 }),
    ),
  ]);

  cachedCategories = {
    names: nameCategories,
    descriptions: descCategories,
  };
  lastFetched = Date.now();
  return cachedCategories;
}
```

Hydrates [`CategTagsWrapper`](../../../wrappers/CategTagsWrapper.tsx) → [`CategoriesAndTagsProvider`](../../../context/CategoriesAndTagsContext.tsx). See [categories-and-tags.md](../context/categories-and-tags.md).

`RootLayout` also calls `await dbConnect.connect()` before reading cache — ensures connection before render (duplicate with cache miss path is harmless).

## Main layout CSS notes

```tsx
<main
  className="flex-1 ... flex-grow" // w-full so the element doesn't start off as collapsed
  style={{ maxWidth: "1280px" }}   // since tailwind is ignoring maxwidth in classNames
>
```

```tsx
{/* flex-1 in flex column means: main takes up the remaining flex space, so footer stays at the bottom */}
```

## Related

- [categories-and-tags.md](../context/categories-and-tags.md)
- [categories-and-tags-route.md](./api/categories-and-tags-route.md)
- [`docs/FUTURE.md`](../../FUTURE.md) — Option B: server-fetch likes into `LikesWrapper`
