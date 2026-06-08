import {
  CONTACT_MESSAGE_LANGUAGE_ERROR,
  detectBotPatterns,
  hasRealisticContactFields,
  hasRealisticContent,
  hasRealisticMessage,
  hasRealisticName,
  isEnglishOrSpanishScript,
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

  it("detects long single-token alphanumeric strings (contact spam names)", () => {
    expect(detectBotPatterns(SPAM_NAME)).toBe(true);
    expect(detectBotPatterns(SPAM_MESSAGE)).toBe(true);
  });

  it("allows normal sentences and typical names", () => {
    expect(detectBotPatterns("Hello, this is a normal message.")).toBe(false);
    expect(detectBotPatterns("Janet Spellman")).toBe(false);
    expect(detectBotPatterns("Wojciechowski")).toBe(false);
  });

  it("does not flag a lone URL (low score; needs other signals)", () => {
    expect(detectBotPatterns("See https://example.com for details")).toBe(
      false,
    );
  });
});

describe("isEnglishOrSpanishScript", () => {
  it("accepts English and Spanish", () => {
    expect(isEnglishOrSpanishScript("Hello from the shelter")).toBe(true);
    expect(
      isEnglishOrSpanishScript(
        "Buenos días, me gustaría información sobre la adopción.",
      ),
    ).toBe(true);
  });

  it("rejects non-Latin scripts", () => {
    expect(isEnglishOrSpanishScript("我想咨询收养流程")).toBe(false);
    expect(
      isEnglishOrSpanishScript(
        "日本語の場合はランダムに生成された文章以外に、著作権が切れた小説などが利用されることもある",
      ),
    ).toBe(false);
    expect(
      isEnglishOrSpanishScript(
        "Я хотел бы узнать о процедуре усыновления животных",
      ),
    ).toBe(false);
  });
});

describe("hasRealisticName", () => {
  it("accepts non-empty names including long surnames", () => {
    expect(hasRealisticName(SPAM_NAME)).toBe(true);
    expect(hasRealisticName("Janet")).toBe(true);
    expect(hasRealisticName("Janet Spellman")).toBe(true);
    expect(hasRealisticName("Wojciechowski")).toBe(true);
  });

  it("rejects empty or whitespace-only names", () => {
    expect(hasRealisticName("")).toBe(false);
    expect(hasRealisticName("   ")).toBe(false);
  });
});

describe("hasRealisticMessage", () => {
  it("rejects spam-style gibberish messages", () => {
    expect(hasRealisticMessage(SPAM_MESSAGE)).toBe(false);
  });

  it("rejects a single long word", () => {
    expect(hasRealisticMessage("abcdefghijklmnopqrst")).toBe(false);
  });

  it("accepts English and Spanish multi-word messages", () => {
    expect(hasRealisticMessage("Hello from the shelter")).toBe(true);
    expect(
      hasRealisticMessage(
        "Hola, quisiera información sobre la adopción de mascotas.",
      ),
    ).toBe(true);
  });

  it("rejects non-English/Spanish scripts", () => {
    expect(hasRealisticMessage("我想咨询收养流程")).toBe(false);
    expect(
      hasRealisticMessage(
        "日本語の場合はランダムに生成された文章以外に、著作権が切れた小説などが利用されることもある",
      ),
    ).toBe(false);
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

  it("accepts realistic English contact fields", () => {
    expect(
      hasRealisticContactFields("Janet Spellman", "Hello from the shelter"),
    ).toBe(true);
  });

  it("rejects Japanese contact message", () => {
    expect(
      hasRealisticContactFields(
        "normal name",
        "日本語の場合はランダムに生成された文章以外に、著作権が切れた小説などが利用されることもある",
      ),
    ).toBe(false);
  });
});

describe("CONTACT_MESSAGE_LANGUAGE_ERROR", () => {
  it("mentions English and Spanish", () => {
    expect(CONTACT_MESSAGE_LANGUAGE_ERROR).toMatch(/English or Spanish/i);
  });
});
