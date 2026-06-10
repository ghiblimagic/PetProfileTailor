# sendContactEmail

Source: [`app/actions/sendContactEmail.ts`](../../../app/actions/sendContactEmail.ts)

## Overview

Server action for `/contact`. Validates submission, verifies reCAPTCHA, rate-limits by IP, then sends two Resend emails (copy to submitter + notification to admin).

## Check order (intentional)

1. Honeypot fields (`website`, `phone`)
2. Form timing (`formStartTime` — min 3s, max 1h)
3. Required fields, email format, length caps
4. English/Spanish script (`isEnglishOrSpanishScript`)
5. `detectBotPatterns` + `hasRealisticContactFields`
6. reCAPTCHA verify (v3 score ≥ 0.7 when score present)
7. Rate limit (`rateLimitPresets.contact` — 3 per 5 min)
8. Resend send

Rate limit runs **after** captcha so failed validations do not consume the contact quota. In E2E mode, rate limit still runs before the email-skip return so `contact.spec.ts` can test throttling.

## Client

[`components/Contact/ContactForm.tsx`](../../../components/Contact/ContactForm.tsx) — `useActionState(sendContactEmail, …)`.

## Related

- [`utils/api/validateContactSubmission.ts`](../../../utils/api/validateContactSubmission.ts) — honeypot, timing, email/length, reCAPTCHA threshold (unit tested)
- [`utils/api/detectBotPatterns.ts`](../../../utils/api/detectBotPatterns.ts)
- [`utils/api/rateLimiter.ts`](../../../utils/api/rateLimiter.ts)
