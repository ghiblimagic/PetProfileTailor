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

Rate limit runs **after** captcha so failed validations do not consume the contact quota.

## Client

[`components/Contact/ContactForm.jsx`](../../../components/Contact/ContactForm.jsx) — `useActionState(sendContactEmail, …)`.

## Related

- [`utils/api/detectBotPatterns.ts`](../../../utils/api/detectBotPatterns.ts)
- [`utils/api/rateLimiter.ts`](../../../utils/api/rateLimiter.ts)
