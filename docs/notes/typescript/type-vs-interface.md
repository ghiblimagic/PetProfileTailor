# `type` vs `interface`

General TypeScript guidance for this repo’s JS → TS migration. **Not** a React or Next.js requirement — both work for component props and server code.

## They overlap

For a plain object shape (props, API body, config), either is fine:

```ts
interface User {
  id: string;
  name: string;
}

type User = {
  id: string;
  name: string;
};
```

Pick one style per module when there’s no technical reason to prefer the other.

## Use `type` when…

**Unions** — only `type` can express “one of these”:

```ts
type Status = "pending" | "resolved";
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

**Intersections** — combining shapes:

```ts
type ContentListingItem = LikeableContent & EditableContent;
```

**Aliases** for primitives, tuples, mapped/utility types:

```ts
type UserId = string;
type Pair = [string, number];
type ReadonlyUser = Readonly<User>;
```

**Optional widening** next to unions in the same file:

```ts
type AddReportProps = {
  dataType: ContentType | string;
  // ...
};
```

## Use `interface` when…

**Object contracts you extend:**

```ts
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}
```

**Declaration merging** (e.g. augmenting `next-auth` session types) — `interface` can merge; `type` cannot.

**Domain models** some teams treat as “things with fields” — style choice, not a compiler rule.

## Quick decision flow

1. Union, intersection, tuple, or utility type? → **`type`**
2. Plain object you might extend or augment? → **`interface`** (or `type` — still valid)
3. Unsure? → pick one and stay consistent in that file

## What this repo has been doing

The migration wave mostly uses **`export type … = { … }`** because many shapes sit beside unions (`ContentType | string`, `"swr" | "standalone"`) and intersections (`ContentListingItem`). Consistency within a conversion batch mattered more than switching existing `type` aliases to `interface`.

Workspace rule of thumb (`.cursor/rules/Typescript.mdc`): **`interface` for object shapes, `type` for unions and primitives**. New code can follow that more strictly if you prefer — no need to rewrite converted files unless you want a repo-wide style pass.

## Rule of thumb

- **`interface`** — object blueprint you might extend
- **`type`** — any named type expression, especially when it isn’t a simple extendable object

Neither is “more correct” for React or Next.js.
