# Name, Description

Sources:

- [`models/Name.ts`](../../models/Name.ts)
- [`models/Description.ts`](../../models/Description.ts)

## Overview

Core user-submitted content models. Both store display `content`, duplicate-check `normalizedContent`, optional `notes`, tag refs, and `likedByCount` (denormalized; updated by like toggle APIs).

| Model | Collection | Unique fields |
|-------|------------|---------------|
| `Name` | `names` (explicit 3rd arg) | `content`, `normalizedContent` + `mongoose-unique-validator` |
| `Description` | `descriptions` (default plural) | `content` only |

## Name — migration collection name

```typescript
mongoose.model<INameDocument>("Name", NameSchema, "names");
```

The third argument `"names"` matches the existing MongoDB collection so migration scripts work outside the Next.js app context (same pattern as `namelikes`, `thanks`).

## Description — `createdBy` optional

`createdBy` is not required on descriptions (legacy data may omit it). Names always require `createdBy`.

## `findNormalizedMatch` usage

Both models satisfy `NormalizedContentFields` (`normalizedContent: string`):

- `findExactNormalized` — duplicate on submit
- `findStartNormalized` — description “check if exists” on `/adddescriptions`
- Name check-if-exists uses its own route, not `findNormalizedMatch`

## Main routes

| Model | Routes |
|-------|--------|
| `Name` | `app/api/names`, `app/api/names/swr`, `app/api/names/likes/[contentId]/togglelike`, `app/name/[name]` |
| `Description` | `app/api/description`, `app/api/description/swr`, `app/api/description/likes/.../togglelike`, `app/description/[id]` |

## Related

- [`utils/stringManipulation/findNormalizedMatch.ts`](../../utils/stringManipulation/findNormalizedMatch.ts)
- Like collections: `NameLike`, `DescriptionLike`
