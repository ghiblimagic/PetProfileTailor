/**
 * Flow notes: docs/notes/app/actions/sendContactEmail.md
 */
"use server";

import { Resend } from "resend";
import { headers } from "next/headers";
import {
  rateLimiter,
  rateLimitPresets,
  getClientIP,
} from "@/utils/api/rateLimiter";
import ContactEmailCopy from "@/components/EmailTemplates/contact-copy-to-submitter";
import ContactNotification from "@/components/EmailTemplates/contact-notification";
import {
  CONTACT_MESSAGE_LANGUAGE_ERROR,
  detectBotPatterns,
  hasRealisticContactFields,
  isEnglishOrSpanishScript,
} from "@utils/api/detectBotPatterns";
import { isE2eCaptchaBypass } from "@/utils/api/e2eTestMode";
import {
  isHoneypotTriggered,
  isRecaptchaAcceptable,
  validateContactEmail,
  validateContactFieldLengths,
  validateContactFormTiming,
  validateRequiredContactFields,
} from "@/utils/api/validateContactSubmission";

const resend = new Resend(process.env.RESEND_API_KEY);

export type ContactEmailState = {
  success: boolean;
  error: string | null;
  email: string | null;
};

interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
}

function getFormString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function sendContactEmail(
  _prevState: ContactEmailState,
  formData: FormData,
): Promise<ContactEmailState> {
  const name = getFormString(formData.get("name"));
  const email = getFormString(formData.get("email"));
  const message = getFormString(formData.get("message"));
  const captchaToken = getFormString(formData.get("captchaToken"));

  // HONEYPOT CHECK - if filled, it's a bot
  const honeypotWebsite = getFormString(formData.get("website"));
  const honeypotPhone = getFormString(formData.get("phone"));
  if (isHoneypotTriggered(honeypotWebsite, honeypotPhone)) {
    console.log("Bot detected: Honeypot filled", {
      honeypotWebsite,
      honeypotPhone,
    });
    return { success: false, error: "Invalid form submission.", email: null };
  }

  // Get client IP early for logging and rate limiting
  const headersList = await headers();
  const clientIP = getClientIP(headersList);

  // Time-based checks — kick out requests from bots, who will usually submit quickly
  const formStartTime = parseInt(getFormString(formData.get("formStartTime")), 10);
  const submissionTime = Date.now();
  const timing = validateContactFormTiming(formStartTime, submissionTime);
  if (!timing.ok) {
    if (timing.error === "Form submitted too quickly.") {
      // Less than 3 seconds
      console.log("Bot detected: Too fast", {
        timeSpent: submissionTime - formStartTime,
        ip: clientIP,
      });
    }
    return { success: false, error: timing.error, email: null };
  }

  // ******************** Validation ********************
  const required = validateRequiredContactFields(
    name,
    email,
    message,
    captchaToken,
  );
  if (!required.ok) {
    return { success: false, error: required.error, email: null };
  }

  const emailCheck = validateContactEmail(email);
  if (!emailCheck.ok) {
    return { success: false, error: emailCheck.error, email: null };
  }

  const lengths = validateContactFieldLengths(name, email, message);
  if (!lengths.ok) {
    return { success: false, error: lengths.error, email: null };
  }

  if (!isEnglishOrSpanishScript(message)) {
    return { success: false, error: CONTACT_MESSAGE_LANGUAGE_ERROR, email: null };
  }

  // BOT PATTERN DETECTION
  if (detectBotPatterns(name) || detectBotPatterns(message)) {
    console.log("Bot detected: Suspicious content pattern", {
      name,
      messagePreview: message.substring(0, 50),
      ip: clientIP,
    });
    return {
      success: false,
      error: "Message contains invalid content.",
      email: null,
    };
  }

  // REALISTIC CONTENT CHECK
  if (!hasRealisticContactFields(name, message)) {
    console.log("Bot detected: Unrealistic content", {
      name,
      messagePreview: message.substring(0, 50),
      ip: clientIP,
    });
    return { success: false, error: "Please enter a valid message.", email: null };
  }

  const e2eBypass = isE2eCaptchaBypass(captchaToken);

  // ******************** Recaptcha ********************
  if (!e2eBypass) {
  try {
    const captchaVerify = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY ?? "",
          response: captchaToken,
        }),
      },
    );
    if (!captchaVerify.ok) {
      return { success: false, error: "Captcha verification failed.", email: null };
    }

    const captchaData =
      (await captchaVerify.json()) as RecaptchaVerifyResponse;

    // Detailed logging with all available data
    console.log("reCAPTCHA Details:", {
      type: captchaData.score ? "v3" : "v2",
      success: captchaData.success,
      // when score/action exist for that captcha version, include them in the log object
      ...(captchaData.score !== undefined && { score: captchaData.score }),
      ...(captchaData.action && { action: captchaData.action }),
      ...(captchaData["error-codes"] && {
        errors: captchaData["error-codes"],
      }),
      // Spreading undefined does nothing (ignored)
      ip: clientIP,
      timestamp: new Date().toISOString(),
    });

    if (!isRecaptchaAcceptable(captchaData)) {
      return {
        success: false,
        error: "reCAPTCHA failed. Please try again.",
        email,
      };
    }
  } catch (error) {
    console.error("Captcha verification error:", error);
    return { success: false, error: "Could not verify captcha.", email: null };
  }
  }

  // Check rate limit to not punish them for errors (only after validating everything else)
  const rateCheck = rateLimiter.check(clientIP, rateLimitPresets.contact);

  if (!rateCheck.allowed) {
    const minutesUntilReset = Math.ceil(
      (rateCheck.resetTime - Date.now()) / 60000,
    );
    return {
      success: false,
      error: `Too many requests. Please try again in ${minutesUntilReset} minute${
        minutesUntilReset > 1 ? "s" : ""
      }.`,
      email,
    };
  }

  if (e2eBypass) {
    return {
      success: false,
      error: "E2E test mode — email send skipped.",
      email: null,
    };
  }

  // ******************** Send emails ********************
  try {
    const from = process.env.RESEND_EMAIL_FROM;
    const adminEmail = process.env.RESEND_FROM_GMAIL;

    if (!from || !adminEmail) {
      console.error("Missing Resend env: RESEND_EMAIL_FROM or RESEND_FROM_GMAIL");
      return { success: false, error: "Failed to send email.", email };
    }

    const [userRes, adminRes] = await Promise.all([
      resend.emails.send({
        from,
        to: email,
        replyTo: adminEmail,
        subject: `Thanks for your message, ${name}`,
        react: ContactEmailCopy({ name, email, message }),
      }),
      resend.emails.send({
        from,
        to: adminEmail,
        replyTo: email,
        subject: `New message from ${name}`,
        react: ContactNotification({ name, email, message }),
      }),
    ]);

    if (userRes.error || adminRes.error) {
      console.error("Resend errors:", userRes.error, adminRes.error);
      return {
        success: false,
        error: "One or more emails failed to send.",
        email,
      };
    }

    return { success: true, error: null, email };
  } catch (error) {
    console.error("Resend error:", error);
    return { success: false, error: "Failed to send email.", email };
  }
}
