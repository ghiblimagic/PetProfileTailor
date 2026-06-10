# findNormalizedMatch

Source: [`utils/stringManipulation/findNormalizedMatch.ts`](../../../../utils/stringManipulation/findNormalizedMatch.ts)

## Overview

Names and Descriptions store a `normalizedContent` field alongside the display `content`. User input is compared against that field to catch duplicates — but “duplicate” means different things depending on *when* you check:

- **On submit** you need a hard match: same text after stripping spaces, punctuation, and casing (`normalizeString`).
- **While typing** you want an early warning when someone pastes the *start* of an existing entry, without waiting for an exact full-string match.

These helpers wrap that logic as Mongoose queries. They all populate `createdBy` (`name`, `profileName`, `profileImage`) so the UI can show who wrote the conflicting entry.

Normalization lives in [`normalizeString.ts`](../../../../utils/stringManipulation/normalizeString.ts). Example: `"  Hello, World!  "` → `"helloworld"`.

## At a glance — which function?

| When | Function | Why |
|------|----------|-----|
| Block exact duplicate on **POST / PATCH** | `findExactNormalized` | Indexed equality on full normalized string; stops at first hit |
| Live “already exists?” while user types | `findStartNormalized` | Anchored `^` regex on normalized prefix; index-friendly, fast |
| Substring search anywhere in the field | `findPartialMatch` | Non-anchored regex; full collection scan — avoid unless necessary |

`escapeRegex` is a small utility used by the two regex-based finders so user punctuation does not break the pattern. You rarely call it directly.

## Where they're used in the app

| Route | Function | Purpose |
|-------|----------|---------|
| `app/api/names/route.js` (POST, PATCH) | `findExactNormalized` | Reject duplicate pet names before save |
| `app/api/description/route.js` (edit flow) | `findExactNormalized` | Reject duplicate descriptions when content changes |
| `app/api/description/check-if-content-exists/[content]/route.ts` | `findStartNormalized` | Return `{ type: "duplicate" }` while user types or pastes |

`findPartialMatch` is **not wired to any route** today. It is kept for cases that need a substring hit without a start-of-string prefix.

## Imports

```typescript
import {
  escapeRegex,
  findExactNormalized,
  findPartialMatch,
  findStartNormalized,
} from "@/utils/stringManipulation/findNormalizedMatch";
```

Models must satisfy `NormalizedContentFields` (`normalizedContent: string`).

---

## `escapeRegex`

Escapes regex metacharacters so user content is treated as literal text inside `$regex` patterns.

```typescript
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

```typescript
escapeRegex("a.b*c?");   // "a\\.b\\*c\\?"
escapeRegex("path[1]");  // "path\\[1\\]"
```

Used internally by `findStartNormalized` and `findPartialMatch`.

## `findExactNormalized`

- Direct equality on `normalizedContent` after normalization.
- Best for strict duplicate detection (no spaces in normalized field).
- Uses `findOne` so MongoDB stops after the first hit.

```typescript
export async function findExactNormalized<T extends NormalizedContentFields>(
  Model: Model<T>,
  content: string,
): Promise<T | null> {
  const normalizedString = normalizeString(content);
  return (await Model.findOne({
    normalizedContent: normalizedString,
  }).populate(CREATED_BY_POPULATE)) as T | null;
}
```

**Example:** reject a duplicate name on POST (`app/api/names/route.js`):

```typescript
const existingNameCheck = await findExactNormalized(Names, content);

if (existingNameCheck) {
  return Response.json(
    {
      message: `Ruh Roh! The name ${content} already exists!`,
      existingName: existingNameCheck,
    },
    { status: 409 },
  );
}
```

**Example:** duplicate check when editing a description (`app/api/description/route.js`):

```typescript
const existingDescriptionCheck = await findExactNormalized(Description, content);

if (existingDescriptionCheck) {
  return Response.json({
    message: "Ruh Roh! This description already exists!",
    existingDescription: existingDescriptionCheck,
  }, { status: 409 });
}
```

## `findStartNormalized`

- Anchored regex (`^…`) at the start of `normalizedContent`.
- **Pro:** Can use the B-tree index on `normalizedContent` when the prefix matches; roughly O(log N).
- **Con:** Still an exact prefix after normalization — extra words at the start yield false negatives.
- Normalizes then slices to the first 400 characters before building the regex.

```typescript
export async function findStartNormalized<T extends NormalizedContentFields>(
  Model: Model<T>,
  content: string,
): Promise<T | null> {
  const normalizedString = normalizeString(content).slice(0, 400);

  return (await Model.findOne({
    normalizedContent: {
      $regex: new RegExp("^" + escapeRegex(normalizedString), "i"),
    },
  }).populate(CREATED_BY_POPULATE)) as T | null;
}
```

**Example:** live duplicate check (`app/api/description/check-if-content-exists/[content]/route.ts`):

```typescript
const existingContentCheck = await findStartNormalized(Description, content);

if (existingContentCheck) {
  return Response.json({
    type: "duplicate",
    data: existingContentCheck,
  });
}
```

Matches when the user pastes the start of an existing description — e.g. `"Sephiroth is an excitable pup"` hits a doc whose `normalizedContent` begins with that normalized prefix.

## `findPartialMatch`

- Non-anchored regex anywhere in the field.
- **Con:** Full collection scan; roughly O(N × M).
- **Pro:** Finds partial matches, not only prefix matches.
- Prefer `findStartNormalized` or `findExactNormalized` when possible.

```typescript
export async function findPartialMatch<T extends NormalizedContentFields>(
  Model: Model<T>,
  content: string,
): Promise<T[]> {
  const normalizedString = normalizeString(content).slice(0, 400);

  return (await Model.find({
    normalizedContent: {
      $regex: escapeRegex(normalizedString),
      $options: "i",
    },
  }).populate(CREATED_BY_POPULATE)) as T[];
}
```

```typescript
// Returns all docs whose normalizedContent contains the normalized substring
const matches = await findPartialMatch(Description, "fluffy butt");
// normalizeString("fluffy butt") → "fluffybutt"
// query: { normalizedContent: { $regex: "fluffybutt", $options: "i" } }
```
