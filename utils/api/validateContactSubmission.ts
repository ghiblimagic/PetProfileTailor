/**
 * Pure contact-form checks used by sendContactEmail (testable without Resend/DB).
 * Flow order: docs/notes/app/actions/sendContactEmail.md
 */

export const CONTACT_FORM_MIN_MS = 3000;
export const CONTACT_FORM_MAX_MS = 3600000;

export type ContactValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function isHoneypotTriggered(website: string, phone: string): boolean {
  return Boolean(website || phone);
}

export function validateContactFormTiming(
  formStartTime: number,
  submissionTime: number,
): ContactValidationResult {
  if (!formStartTime || Number.isNaN(formStartTime)) {
    return { ok: false, error: "Invalid form submission." };
  }

  const timeSpent = submissionTime - formStartTime;

  if (timeSpent < CONTACT_FORM_MIN_MS) {
    return { ok: false, error: "Form submitted too quickly." };
  }

  if (timeSpent > CONTACT_FORM_MAX_MS) {
    return {
      ok: false,
      error: "Form session expired. Please refresh and try again.",
    };
  }

  return { ok: true };
}

export function validateRequiredContactFields(
  name: string,
  email: string,
  message: string,
  captchaToken: string,
): ContactValidationResult {
  if (!name || !email || !message || !captchaToken) {
    return { ok: false, error: "All fields are required." };
  }
  return { ok: true };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactEmail(email: string): ContactValidationResult {
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: "Invalid email address." };
  }
  return { ok: true };
}

export function validateContactFieldLengths(
  name: string,
  email: string,
  message: string,
): ContactValidationResult {
  if (message.length > 10000 || name.length > 100 || email.length > 254) {
    return { ok: false, error: "Input too long." };
  }
  return { ok: true };
}

export type RecaptchaVerifyPayload = {
  success: boolean;
  score?: number;
};

/** v3: score must be ≥ 0.7 when present; v2: success only. */
export function isRecaptchaAcceptable(data: RecaptchaVerifyPayload): boolean {
  if (!data.success) return false;
  if (data.score !== undefined && data.score < 0.7) return false;
  return true;
}
