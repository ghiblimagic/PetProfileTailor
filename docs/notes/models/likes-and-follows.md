# NameLike, DescriptionLike, Follow

Sources:

- [`models/NameLike.ts`](../../models/NameLike.ts)
- [`models/DescriptionLike.ts`](../../models/DescriptionLike.ts)
- [`models/Follow.ts`](../../models/Follow.ts)

## Overview

Three small Mongoose models for **social edges** — who liked what, and (via migration) who follows whom.

| Model | Purpose | Runtime app usage |
|-------|---------|-------------------|
| `NameLike` | One row per user ↔ name like | Like toggle API, notifications, user likes |
| `DescriptionLike` | One row per user ↔ description like | Same for descriptions |
| `Follow` | One row per follower → followed user | [`updatefollows`](../app/api/user/updatefollows/route.ts) API + profile/user read paths (`getUserFollowers`) |

All three use `{ timestamps: true }` and explicit MongoDB collection names (third arg to `mongoose.model`) so migration scripts work outside the Next.js app context.

## At a glance — fields

### NameLike / DescriptionLike (same shape)

| Field | Meaning |
|-------|---------|
| `likedBy` | User who clicked like |
| `contentCreator` | Owner of the name/description (notification recipient) |
| `contentId` | Ref to `Name` or `Description` |
| `read` | Notification read flag (default `false`) |

### Follow

| Field | Meaning |
|-------|---------|
| `userId` | User being followed |
| `followedBy` | User who follows them |

---

## Where they're used

| Model | Route / file | What happens |
|-------|--------------|--------------|
| `NameLike` | `app/api/names/likes/[contentId]/togglelike/route.ts` | Transaction: create/delete like doc + bump `Name.likedByCount` |
| `NameLike` | `app/api/notifications/names/route.ts` | Paginated like notifications for content creator |
| `NameLike` | `app/api/notifications/names/mark-read/route.ts` | Mark like notifications read |
| `DescriptionLike` | `app/api/description/likes/[contentId]/togglelike/route.ts` | Same as names |
| `DescriptionLike` | `app/api/notifications/descriptions/route.ts` | Description like notifications |
| `NameLike` / `DescriptionLike` | `app/api/user/likes/route.js` | List what the logged-in user has liked |
| `Follow` | `migrations/followersIntoFollowDb.js` | Copy `User.followers[]` into `follows` collection |
| `Follow` | `app/api/user/grabusersfollowing/[userid]/route.ts` | List who a user follows (`getUserFollowing`) |

**Note:** [`FollowButton.tsx`](../../components/Shared/content-actions/FollowButton.tsx) calls `app/api/user/updatefollows` — that creates/deletes `Follow` documents in the `follows` collection.

---

## Indexes

### Unique pair — prevent duplicate likes / follows

```typescript
// NameLike, DescriptionLike — prevent duplicate likes
NameLikeSchema.index({ likedBy: 1, contentId: 1 }, { unique: true });

// Follow — prevent duplicate follow edges
FollowSchema.index({ userId: 1, followedBy: 1 }, { unique: true });
```

**Original comments (NameLike / DescriptionLike):**

> An index in MongoDB is like a sorted lookup table for faster queries. Instead of scanning the entire collection to find matches, MongoDB jumps straight to the right place in the index. In this case, you're building an index on two fields: `likedBy` and `contentId` (or `userId` and `contentId` in older notes).
>
> `{ likedBy: 1, contentId: 1 }` — “Make an index where documents are sorted by `likedBy` first, then by `contentId`.”
>
> `{ unique: true }` — makes the combination unique across the entire collection, so it can only be liked once.

Toggle-like routes rely on this for `findOne({ likedBy, contentId })` before insert:

```typescript
const existingLike = await NameLikes.findOne({ likedBy, contentId });
if (existingLike) {
  // Unlike — delete doc, decrement likedByCount
} else {
  // Like — insert doc, increment likedByCount
}
```

### Notification sort — likes only

```typescript
NameLikeSchema.index({ contentCreator: 1, read: 1, createdAt: -1 });
```

**Original comments:**

> Quick lookup + sorting for notification feeds.
>
> - `read: 1` → ensures unread (`read: false`) come first if you sort `{ read: 1 }`.
> - `createdAt: -1` → ensures newest first within each read/unread group.

Notification query pattern (`app/api/notifications/names/route.ts`):

```typescript
await getPaginatedNotifications(
  NameLike,
  {
    contentCreator: userId,
    likedBy: { $ne: userId }, // don't notify when you like your own content
  },
  [
    { path: "likedBy", select: ["profileName", "profileImage", "name"] },
    { path: "contentId", select: ["content", "createdBy", "tags"] },
  ],
  { page, limit },
);
```

---

## Source (annotated) — NameLike

```typescript
import mongoose, { Document, Model } from "mongoose";

export interface INameLike {
  likedBy: mongoose.Types.ObjectId;       // user who liked
  contentCreator: mongoose.Types.ObjectId; // owner — gets the notification
  contentId: mongoose.Types.ObjectId;      // ref Name
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const NameLikeSchema = new mongoose.Schema<INameLikeDocument>(
  {
    likedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contentCreator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: "Name", required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// prevent duplicate likes
NameLikeSchema.index({ likedBy: 1, contentId: 1 }, { unique: true });

// quick lookup + sorting
NameLikeSchema.index({ contentCreator: 1, read: 1, createdAt: -1 });
// read: 1 → ensures unread (read: false) come first if you sort { read: 1 }.
// createdAt: -1 → ensures newest first within each read/unread group.

const NameLike: Model<INameLikeDocument> =
  (mongoose.models.NameLike as Model<INameLikeDocument>) ||
  mongoose.model<INameLikeDocument>("NameLike", NameLikeSchema, "namelikes");
// Third arg "namelikes" — explicit collection name for migration scripts outside app context
```

---

## Source (annotated) — DescriptionLike

Same structure as `NameLike`; `contentId` refs `Description` instead of `Name`.

```typescript
DescriptionLikeSchema.index({ likedBy: 1, contentId: 1 }, { unique: true });
DescriptionLikeSchema.index({ contentCreator: 1, read: 1, createdAt: -1 });

mongoose.model<IDescriptionLikeDocument>(
  "DescriptionLike",
  DescriptionLikeSchema,
  "descriptionlikes", // explicit collection name
);
```

**Original DescriptionLike index comment** (same idea, different ref name in old notes):

> In this case, you're building an index on two fields: `userId` and `descriptionId` — in the current schema those are `likedBy` + `contentId`.

---

## Source (annotated) — Follow

```typescript
const FollowSchema = new mongoose.Schema<IFollowDocument>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    followedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// prevent duplicate follows (comment in original JS said "likes" — copy-paste from like models)
FollowSchema.index({ userId: 1, followedBy: 1 }, { unique: true });

// FollowSchema.index — original learning notes:
// An index in MongoDB is like a sorted lookup table for faster queries.
// { userId: 1, followedBy: 1 } — sorted by user being followed, then follower.
// { unique: true } — one follow edge per pair.

mongoose.model<IFollowDocument>("Follow", FollowSchema, "follows");
```

Migration insert shape (`migrations/followersIntoFollowDb.js`):

```javascript
const followsToInsert = followers.map((followerId) => ({
  userId,              // the user being followed
  followedBy: followerId, // the follower
}));
await Follows.insertMany(followsToInsert, { ordered: false });
```

---

## Collections

| Model | `mongoose.model` name | MongoDB collection |
|-------|----------------------|-------------------|
| `NameLike` | `"NameLike"` | `namelikes` |
| `DescriptionLike` | `"DescriptionLike"` | `descriptionlikes` |
| `Follow` | `"Follow"` | `follows` |

Explicit collection names match existing MongoDB collections from earlier migrations — required when scripts run outside the usual app context (same pattern as `Name` → `"names"`).

---

## Related files

- [`utils/api/getPaginatedNotifications.ts`](../../utils/api/getPaginatedNotifications.ts) — shared pagination for notification routes
- [`docs/notes/models/likes-and-follows.md`](likes-and-follows.md) — this file
- Migrations: `migrations/addReadField.js`, `migrations/migrationLikesToLikesCollection.js`, `migrations/followersIntoFollowDb.js`
