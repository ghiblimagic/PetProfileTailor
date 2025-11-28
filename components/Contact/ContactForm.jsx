"use client";

import { useState } from "react";
import { useActionState } from "react";
import { sendContactEmail } from "@/app/actions/sendContactEmail";
import LoadingSpinner from "../ui/LoadingSpinner";
import StyledInput from "../FormComponents/StyledInput";
import StyledTextarea from "../FormComponents/StyledTextarea";
import GeneralButton from "../ReusableSmallComponents/buttons/GeneralButton";
const [formStartTime] = useState(Date.now());
// for bots that send messages too quickly

import ReCAPTCHA from "react-google-recaptcha";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export default function ContactPage() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [showV2, setShowV2] = useState(false);
  const [v2Token, setV2Token] = useState(null);

  const [state, formAction, isPending] = useActionState(sendContactEmail, {
    success: false,
    error: null,
    email: null,
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    let captchaToken;

    try {
      if (!executeRecaptcha && !v2Token) {
        alert("reCAPTCHA not ready. Please try again.");
        return;
      }

      // Try v3 first
      if (!showV2) {
        captchaToken = await executeRecaptcha("contact_form");
        if (!captchaToken) {
          // fallback to v2 if v3 fails
          setShowV2(true);
          return;
        }
      } else {
        // fallback v2 token
        if (!v2Token) {
          alert("Please complete the CAPTCHA");
          return;
        }
        captchaToken = v2Token;
      }

      // ✅ Add token to formData
      formData.append("captchaToken", captchaToken);

      // Submit the action
      await formAction(formData);
    } catch (err) {
      console.error("Error getting reCAPTCHA token:", err);
    }
  }

  return (
    <>
      <div className="flex mt-8 justify-center text-subtleWhite">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col max-w-md w-full rounded-2xl shadow-lg"
        >
          <StyledInput
            name="name"
            placeholder="Name"
            required
            className="bg-secondary mt-3"
            label="Name"
          />

          <StyledInput
            name="email"
            type="email"
            placeholder="Email"
            className="bg-secondary mt-3"
            required
            label="Email"
          />

          <h4>Message</h4>
          <StyledTextarea
            name="message"
            required
            maxLength={10000}
            aria-label="type your message"
            className="bg-secondary mt-3"
          />

          {/* Optional fallback CAPTCHA */}
          {showV2 && (
            <div className="flex justify-center my-3">
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY}
                onChange={(token) => setV2Token(token)}
              />
            </div>
          )}

          <GeneralButton
            type="submit"
            disabled={isPending}
            text={isPending ? "Sending..." : "Submit"}
            className="w-fit mx-auto mt-6"
          />

          {isPending && <LoadingSpinner />}

          <p className="text-center rounded-lg my-2">
            <strong>No email?</strong> Please check for typos and your spam
            folder.
          </p>
          <p className="text-center rounded-lg mb-2">
            It may take several minutes for the email to arrive.
          </p>

          {state?.success && (
            <p className="text-green-600 text-center">
              Message sent successfully!
            </p>
          )}
          {state?.error && (
            <p className="text-red-600 text-center">{state.error}</p>
          )}

          <input
            type="hidden"
            name="formStartTime"
            value={formStartTime}
          />
        </form>
      </div>

      {state?.email && (
        <p className="text-center my-4 text-subtleWhite">
          The email entered was:{" "}
          <strong className="underline">{state.email}</strong>
        </p>
      )}
    </>
  );
}
