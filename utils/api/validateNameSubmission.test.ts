import {
  NAME_MAX_LENGTH,
  formatNameDuplicateMessage,
  formatNameInvalidCharsMessage,
  shouldRecheckNameDuplicateOnUpdate,
  shouldRunNameBlocklistOnUpdate,
  validateNameLength,
} from "./validateNameSubmission";

describe("validateNameLength", () => {
  it("accepts names at the max length", () => {
    expect(validateNameLength("a".repeat(NAME_MAX_LENGTH))).toEqual({ ok: true });
  });

  it("rejects names over 50 characters with the legacy message", () => {
    const long = "a".repeat(NAME_MAX_LENGTH + 1);
    expect(validateNameLength(long)).toEqual({
      ok: false,
      message: `Ruh Roh! The name ${long} has more than 50 characters. It is ${long.length} characters`,
    });
  });
});

describe("shouldRunNameBlocklistOnUpdate", () => {
  it("runs when content or notes is present", () => {
    expect(shouldRunNameBlocklistOnUpdate("Fluffy", "")).toBe(true);
    expect(shouldRunNameBlocklistOnUpdate("", "note")).toBe(true);
    expect(shouldRunNameBlocklistOnUpdate("", "")).toBe(false);
  });
});

describe("shouldRecheckNameDuplicateOnUpdate", () => {
  it("skips when content is unchanged ignoring case", () => {
    expect(shouldRecheckNameDuplicateOnUpdate("fluffy", "Fluffy")).toBe(false);
  });

  it("checks when content changes", () => {
    expect(shouldRecheckNameDuplicateOnUpdate("batman", "robin")).toBe(true);
  });

  it("skips empty content", () => {
    expect(shouldRecheckNameDuplicateOnUpdate("", "Fluffy")).toBe(false);
  });
});

describe("response message helpers", () => {
  it("formats duplicate and invalid-char messages", () => {
    expect(formatNameDuplicateMessage("fluffy")).toBe(
      "Ruh Roh! The name fluffy already exists!",
    );
    expect(formatNameInvalidCharsMessage("bad@", ["@"])).toBe(
      "Ruh Roh! The name bad@ has invalid character(s) @",
    );
  });
});
