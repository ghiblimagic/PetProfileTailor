import { describe, expect, it } from "vitest";
import {
  buildLikesMapsFromResponse,
  type UserLikesResponse,
} from "./userLikesResponse";

describe("buildLikesMapsFromResponse", () => {
  it("maps contentId strings to null-valued entries", () => {
    const data: UserLikesResponse = {
      names: [{ id: "like-1", contentId: "name-abc" }],
      descriptions: [{ id: "like-2", contentId: "desc-xyz" }],
    };

    const maps = buildLikesMapsFromResponse(data);

    expect(maps.names.has("name-abc")).toBe(true);
    expect(maps.descriptions.has("desc-xyz")).toBe(true);
    expect(maps.names.size).toBe(1);
    expect(maps.descriptions.size).toBe(1);
  });

  it("handles empty arrays", () => {
    const maps = buildLikesMapsFromResponse({ names: [], descriptions: [] });
    expect(maps.names.size).toBe(0);
    expect(maps.descriptions.size).toBe(0);
  });
});
