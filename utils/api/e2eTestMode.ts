/** Shared E2E-only flags — only active when server/client env is set at build/start. */

export const E2E_CAPTCHA_BYPASS_TOKEN = "e2e-bypass";

export function isE2eClientMode(): boolean {
  return process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true";
}

export function isE2eCaptchaBypass(captchaToken: string | null | undefined): boolean {
  return (
    process.env.E2E_TEST_MODE === "true" &&
    captchaToken === E2E_CAPTCHA_BYPASS_TOKEN
  );
}
