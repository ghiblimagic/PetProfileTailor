import {
  mergePostBodyWithSearchParams,
  parseNamesSwrRequest,
  parseSourceFromGet,
} from "./parseNamesSwrRequest";

describe("parseSourceFromGet", () => {
  it("collects repeated query params into arrays", () => {
    const params = new URLSearchParams("tags=a&tags=b&page=2");
    const source = parseSourceFromGet(params);

    expect(source.tags).toEqual(["a", "b"]);
    expect(source.page).toBe("2");
  });

  it("parses likedIds from repeated params", () => {
    const params = new URLSearchParams("likedIds=abc&likedIds=def");
    const source = parseSourceFromGet(params);

    expect(source.likedIds).toEqual(["abc", "def"]);
  });

  it("wraps a single likedIds query value as-is (comma split only when param absent)", () => {
    const params = new URLSearchParams("likedIds=abc, def ,ghi");
    const source = parseSourceFromGet(params);

    expect(source.likedIds).toEqual(["abc, def ,ghi"]);
  });
});

describe("mergePostBodyWithSearchParams", () => {
  it("keeps body values and fills missing keys from query", () => {
    const body = { tags: ["from-body"], page: 3 };
    const params = new URLSearchParams(
      "page=1&sortingproperty=likedByCount&profileUserId=user1",
    );

    const source = mergePostBodyWithSearchParams(body, params);

    expect(source.page).toBe(3);
    expect(source.tags).toEqual(["from-body"]);
    expect(source.sortingproperty).toBe("likedByCount");
    expect(source.profileUserId).toBe("user1");
  });
});

describe("parseNamesSwrRequest", () => {
  it("applies defaults for page, sort field, and sort direction", () => {
    const parsed = parseNamesSwrRequest({});

    expect(parsed).toEqual({
      page: 1,
      sortingValue: -1,
      sortingProperty: "likedByCount",
      tags: undefined,
      profileUserId: undefined,
      likedIds: undefined,
    });
  });

  it("normalizes single tag and likedIds values to arrays", () => {
    const parsed = parseNamesSwrRequest({
      page: "2",
      sortingvalue: "1",
      sortingproperty: "_id",
      tags: "tag1",
      likedIds: "like1",
      profileUserId: "user123",
    });

    expect(parsed.page).toBe(2);
    expect(parsed.sortingValue).toBe(1);
    expect(parsed.sortingProperty).toBe("_id");
    expect(parsed.tags).toEqual(["tag1"]);
    expect(parsed.likedIds).toEqual(["like1"]);
    expect(parsed.profileUserId).toBe("user123");
  });
});
