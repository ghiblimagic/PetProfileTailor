import normalizeString from "./normalizeString";

describe("normalizeString", () => {
  it("trims, removes spaces, strips punctuation, and lowercases", () => {
    expect(normalizeString("  Hello, World!  ")).toBe("helloworld");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeString("   ")).toBe("");
  });

  it("preserves letters and numbers", () => {
    expect(normalizeString("Cat123")).toBe("cat123");
  });
});
