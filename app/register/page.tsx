/**
 * Register route — reCAPTCHA provider + RegisterForm.
 * Notes: docs/notes/app/auth-pages.md
 */
"use client";

import "@fortawesome/fontawesome-svg-core/styles.css";
import RegisterForm from "@/components/Register/RegisterForm";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export default function Register() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""}
    >
      <RegisterForm />
    </GoogleReCaptchaProvider>
  );
}
