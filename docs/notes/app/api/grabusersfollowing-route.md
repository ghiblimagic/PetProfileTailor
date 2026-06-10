# grabusersfollowing API route

Source: [`app/api/user/grabusersfollowing/[userid]/route.ts`](../../../app/api/user/grabusersfollowing/[userid]/route.ts)

## Overview

`GET /api/user/grabusersfollowing/[userid]` — returns users that `userid` **follows** (the “following” list).

Previously queried `User.find({ followers: userid })` on a removed field. Now reads `follows` via [`getUserFollowing`](../../../utils/api/getUserFollowing.ts):

| Follow field | Role |
|--------------|------|
| `followedBy` | The viewer (`userid`) |
| `userId` | Each account they follow (populated in the response) |

## Response

JSON array of user summaries: `_id`, `name`, `profileName`, `profileImage`, `bio`, `location`.

## Related

- [`getUserFollowers`](../../../utils/api/getUserFollowers.ts) — inverse (who follows `userid`)
- [`app/api/user/updatefollows/route.ts`](../../../app/api/user/updatefollows/route.ts) — create/delete follow edges
- Profile UI (`UsersFollowingList`) is commented out; server profile page has matching commented `getUserFollowing` hook
