import {
  CONTACT_FORM_MAX_MS,
  CONTACT_FORM_MIN_MS,
  isHoneypotTriggered,
  isRecaptchaAcceptable,
  validateContactEmail,
  validateContactFieldLengths,
  validateContactFormTiming,
  validateRequiredContactFields,
} from "./validateContactSubmission";

describe("isHoneypotTriggered", () => {
  it("returns false when both honeypots are empty", () => {
    expect(isHoneypotTriggered("", "")).toBe(false);
  });

  it("returns true when either honeypot is filled", () => {
    expect(isHoneypotTriggered("http://spam.com", "")).toBe(true);
    expect(isHoneypotTriggered("", "555-1234")).toBe(true);
  });
});

describe("validateContactFormTiming", () => {
  const start = 1_000_000;

  it("rejects missing or invalid formStartTime", () => {
    expect(validateContactFormTiming(0, start + 5000)).toEqual({
      ok: false,
      error: "Invalid form submission.",
    });
    expect(validateContactFormTiming(Number.NaN, start + 5000)).toEqual({
      ok: false,
      error: "Invalid form submission.",
    });
  });

  it(`rejects submissions faster than ${CONTACT_FORM_MIN_MS}ms`, () => {
    expect(validateContactFormTiming(start, start + 1000)).toEqual({
      ok: false,
      error: "Form submitted too quickly.",
    });
  });

  it(`accepts submissions between min and max (${CONTACT_FORM_MAX_MS}ms)`, () => {
    expect(validateContactFormTiming(start, start + 5000)).toEqual({ ok: true });
  });

  it("rejects expired sessions over 1 hour", () => {
    expect(
      validateContactFormTiming(start, start + CONTACT_FORM_MAX_MS + 1),
    ).toEqual({
      ok: false,
      error: "Form session expired. Please refresh and try again.",
    });
  });
});

describe("validateRequiredContactFields", () => {
  it("requires all fields", () => {
    expect(validateRequiredContactFields("", "a@b.com", "hi", "token")).toEqual({
      ok: false,
      error: "All fields are required.",
    });
  });

  it("passes when all fields present", () => {
    expect(
      validateRequiredContactFields("Janet", "a@b.com", "Hello", "token"),
    ).toEqual({ ok: true });
  });
});

describe("validateContactEmail", () => {
  it("rejects malformed addresses", () => {
    expect(validateContactEmail("not-an-email")).toEqual({
      ok: false,
      error: "Invalid email address.",
    });
  });

  it("accepts simple valid addresses", () => {
    expect(validateContactEmail("user@example.com")).toEqual({ ok: true });
  });
});

describe("validateContactFieldLengths", () => {
  it("rejects overlong inputs", () => {
    expect(validateContactFieldLengths("x".repeat(101), "a@b.com", "hi")).toEqual({
      ok: false,
      error: "Input too long.",
    });
  });
});

describe("isRecaptchaAcceptable", () => {
  it("accepts v2 success without score", () => {
    expect(isRecaptchaAcceptable({ success: true })).toBe(true);
  });

  it("rejects v3 scores below 0.7", () => {
    expect(isRecaptchaAcceptable({ success: true, score: 0.5 })).toBe(false);
  });

  it("accepts v3 scores at or above 0.7", () => {
    expect(isRecaptchaAcceptable({ success: true, score: 0.7 })).toBe(true);
  });

  it("rejects failed verification", () => {
    expect(isRecaptchaAcceptable({ success: false, score: 0.9 })).toBe(false);
  });
});
