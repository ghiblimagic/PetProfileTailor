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
  detectBotPatterns,
  hasRealisticContent,
} from "@utils/api/detectBotPatterns";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendContactEmail(prevState, formData) {
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");
  const captchaToken = formData.get("captchaToken");

  // HONEYPOT CHECK - if filled, it's a bot
  const honeypotWebsite = formData.get("website");
  const honeypotPhone = formData.get("phone");
  if (honeypotWebsite || honeypotPhone) {
    console.log("Bot detected: Honeypot filled", {
      honeypotWebsite,
      honeypotPhone,
    });
    return { success: false, error: "Invalid form submission." };
  }

  // Get client IP early for logging and rate limiting
  const headersList = await headers();
  const clientIP = getClientIP(headersList);

  //  Time-based checks,  kick out requests from bots, who will usually submit quickly
  const formStartTime = parseInt(formData.get("formStartTime"));
  if (!formStartTime || isNaN(formStartTime)) {
    return { success: false, error: "Invalid form submission." };
  }

  const submissionTime = Date.now();
  const timeSpent = submissionTime - formStartTime;

  if (timeSpent < 3000) {
    // Less than 3 seconds
    console.log("Bot detected: Too fast", { timeSpent, ip: clientIP });
    return { success: false, error: "Form submitted too quickly." };
  }

  if (timeSpent > 3600000) {
    // 1 hour
    return {
      success: false,
      error: "Form session expired. Please refresh and try again.",
    };
  }

  //  ********************  Validation  ********************
  if (!name || !email || !message || !captchaToken) {
    return { success: false, error: "All fields are required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email address." };
  }

  if (message.length > 10000 || name.length > 100 || email.length > 254) {
    return { success: false, error: "Input too long." };
  }

  // BOT PATTERN DETECTION

  if (detectBotPatterns(message)) {
    console.log("Bot detected: Suspicious message pattern", {
      message: message.substring(0, 50),
      ip: clientIP,
    });
    return { success: false, error: "Message contains invalid content." };
  }

  // REALISTIC CONTENT CHECK
  if (!hasRealisticContent(name, message)) {
    console.log("Bot detected: Unrealistic content", {
      name,
      messagePreview: message.substring(0, 50),
      ip: clientIP,
    });
    return { success: false, error: "Please enter a valid message." };
  }

  //  ********************  Recaptcha  ********************
  try {
    const captchaVerify = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        }),
      },
    );
    if (!captchaVerify.ok) {
      return { success: false, error: "Captcha verification failed." };
    }

    const captchaData = await captchaVerify.json();

    // Detailed logging with all available data
    // this one
    console.log("reCAPTCHA Details:", {
      type: captchaData.score ? "v3" : "v2",
      success: captchaData.success,
      ...(captchaData.score && { score: captchaData.score }),
      // when condition true/ aka if it exists for that version of captcha then use the value to the right

      // if it evaluates to false:
      // Evaluates to: ...(undefined && { score: undefined })
      // && short-circuits, returns: ...undefined
      // Spreading undefined does nothing (ignored), The spread operator ... safely ignores undefined, null, and false values
      ...(captchaData.action && { action: captchaData.action }),
      ...(captchaData["error-codes"] && { errors: captchaData["error-codes"] }),
      ip: clientIP,
      timestamp: new Date().toISOString(),
    });

    if (
      !captchaData.success ||
      (captchaData.score && captchaData.score < 0.7)
    ) {
      return {
        success: false,
        error: "reCAPTCHA failed. Please try again.",
        email,
      };
    }
  } catch (error) {
    console.error("Captcha verification error:", error);
    return { success: false, error: "Could not verify captcha." };
  }

  // Check rate limit to not punish them for errors (only after validating everything else)
  // Get client IP for rate limiting

  // Check rate limit
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

  // ******************** Send emails  ********************
  try {
    const from = process.env.RESEND_EMAIL_FROM;
    const adminEmail = process.env.RESEND_FROM_GMAIL;

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
