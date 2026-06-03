import {
  detectBotPatterns,
  hasRealisticContactFields,
  hasRealisticContent,
  hasRealisticMessage,
  hasRealisticName,
} from "./detectBotPatterns";

const SPAM_NAME = "pvYPqHYUHlHCZOycCCz";
const SPAM_MESSAGE = "atThmePQOohIAlvlCoAYanEC";

describe("detectBotPatterns", () => {
  it("detects repeated characters", () => {
    expect(detectBotPatterns("aaaaaaaaaaa")).toBe(true);
  });

  it("detects spam keywords", () => {
    expect(detectBotPatterns("buy viagra now")).toBe(true);
  });

  it("allows normal sentences", () => {
    expect(detectBotPatterns("Hello, this is a normal message.")).toBe(false);
  });
});

describe("hasRealisticName", () => {
  it("rejects spam-style gibberish names", () => {
    expect(hasRealisticName(SPAM_NAME)).toBe(false);
  });

  it("accepts a single first name", () => {
    expect(hasRealisticName("Janet")).toBe(true);
  });

  it("accepts a full name", () => {
    expect(hasRealisticName("Janet Spellman")).toBe(true);
  });
});

describe("hasRealisticMessage", () => {
  it("rejects spam-style gibberish messages", () => {
    expect(hasRealisticMessage(SPAM_MESSAGE)).toBe(false);
  });

  it("rejects a single long word", () => {
    expect(hasRealisticMessage("abcdefghijklmnopqrst")).toBe(false);
  });

  it("accepts a short multi-word message", () => {
    expect(hasRealisticMessage("Hello from the shelter")).toBe(true);
  });
});

describe("hasRealisticContent", () => {
  it("delegates to hasRealisticMessage", () => {
    expect(hasRealisticContent("Hello from the shelter")).toBe(true);
    expect(hasRealisticContent(SPAM_MESSAGE)).toBe(false);
  });
});

describe("hasRealisticContactFields", () => {
  it("rejects contact spam name and message", () => {
    expect(hasRealisticContactFields(SPAM_NAME, SPAM_MESSAGE)).toBe(false);
  });

  it("accepts realistic contact fields", () => {
    expect(
      hasRealisticContactFields("Janet Spellman", "Hello from the shelter"),
    ).toBe(true);
  });
});
