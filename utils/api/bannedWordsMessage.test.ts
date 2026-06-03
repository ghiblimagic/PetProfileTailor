import bannedWordsMessage from "./bannedWordsMessage";

describe("bannedWordsMessage", () => {
  it("returns substring message", () => {
    expect(
      bannedWordsMessage("bad text", "bio", "spam phrase", "substring"),
    ).toContain("spam phrase");
    expect(bannedWordsMessage("bad text", "bio", "spam phrase", "substring")).toContain(
      "bio",
    );
  });

  it("returns exact-name message", () => {
    expect(
      bannedWordsMessage("bad", "name", "banned", "exact-name"),
    ).toContain("cannot be used by itself");
  });

  it("returns default blocklist message", () => {
    expect(bannedWordsMessage("bad", "title", "word", "word")).toContain(
      "blocklist",
    );
  });
});
