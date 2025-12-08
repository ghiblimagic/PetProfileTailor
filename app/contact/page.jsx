"use client";

import PageTitleWithImages from "@components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages";
import ContactForm from "@components/Contact/ContactForm";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export default function CustomError() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
    >
      <PageTitleWithImages title="Contact" />
      <ContactForm />
    </GoogleReCaptchaProvider>
  );
}
