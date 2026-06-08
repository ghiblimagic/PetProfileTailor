import { checkBlocklists } from "./checkBlocklist";

describe("checkBlocklists", () => {
  it("allows normal content", () => {
    expect(checkBlocklists("fluffy pup")).toEqual({
      allowed: true,
      blockedBy: null,
      type: null,
    });
  });

  it("allows blocklisted exact word when not alone", () => {
    expect(checkBlocklists("fluffy butt")).toEqual({
      allowed: true,
      blockedBy: null,
      type: null,
    });
  });

  it("blocks exact-name when entire content matches a blocklisted word", () => {
    expect(checkBlocklists("butt")).toEqual({
      allowed: false,
      blockedBy: "butt",
      type: "exact-name",
    });
  });

  it("is case-insensitive for exact-name", () => {
    expect(checkBlocklists("BUTT").allowed).toBe(false);
    expect(checkBlocklists("BUTT").type).toBe("exact-name");
  });

  it("blocks banned-everywhere tokens anywhere in the text", () => {
    const result = checkBlocklists("hello wank world");
    expect(result.allowed).toBe(false);
    expect(result.type).toBe("banned-everywhere");
    expect(result.blockedBy).toBe("wank");
  });

  it("blocks substring matches in longer content", () => {
    const result = checkBlocklists("vaginal content");
    expect(result.allowed).toBe(false);
    expect(result.type).toBe("substring");
    expect(result.blockedBy).toBe("vagina");
  });

  it("allows raccoon (coon is exact-name only, not substring or everywhere)", () => {
    expect(checkBlocklists("raccoon")).toEqual({
      allowed: true,
      blockedBy: null,
      type: null,
    });
  });

  it("skips exact-name check for content 100+ characters", () => {
    const padding = "x".repeat(96);
    const result = checkBlocklists(`${padding}butt`);
    expect(result.allowed).toBe(true);
  });
});
