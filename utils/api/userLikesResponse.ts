/**
 * Types and pure helpers for user likes response shape.
 * Notes: docs/notes/app/api/user-likes-route.md
 */

export type UserLikeEntry = {
  id: string;
  contentId: string;
};

export type UserLikesResponse = {
  names: UserLikeEntry[];
  descriptions: UserLikeEntry[];
};

export type UserLikesMaps = {
  names: Map<string, null>;
  descriptions: Map<string, null>;
};

export function buildLikesMapsFromResponse(
  data: UserLikesResponse,
): UserLikesMaps {
  return {
    names: new Map(
      (data.names ?? []).map((r) => [r.contentId.toString(), null]),
    ),
    descriptions: new Map(
      (data.descriptions ?? []).map((r) => [r.contentId.toString(), null]),
    ),
  };
}
