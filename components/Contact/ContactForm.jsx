"use client";

import { useState, useRef, useEffect } from "react";
import { useActionState } from "react";
import { sendContactEmail } from "@/app/actions/sendContactEmail";
import LoadingSpinner from "../ui/LoadingSpinner";
import StyledInput from "../FormComponents/StyledInput";
import StyledTextarea from "../FormComponents/StyledTextarea";
import GeneralButton from "../ReusableSmallComponents/buttons/GeneralButton";

// for bots that send messages too quickly

import ReCAPTCHA from "react-google-recaptcha";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export default function ContactPage() {
  const formStartTime = useRef(Date.now());
  // useRef so:
  //  1. a bot can't spoof the date, like they could with useState
  //  2. It won't rerender and can't accidently change
  //  3. ideal since we want a timestamp that won't change
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [showV2, setShowV2] = useState(false);
  const [v2Token, setV2Token] = useState(null);
  const [recaptchaLoading, setRecaptchaLoading] = useState(true);
  const [recaptchaFailed, setRecaptchaFailed] = useState(false);

  const [state, formAction, isPending] = useActionState(sendContactEmail, {
    success: false,
    error: null,
    email: null,
  });

  // Set recaptcha as loaded when it's ready, with timeout fallback
  useEffect(() => {
    if (executeRecaptcha) {
      setRecaptchaLoading(false);
      setRecaptchaFailed(false);
      return;
    }

    // If recaptcha doesn't load within 10 seconds, show fallback
    const timeout = setTimeout(() => {
      if (!executeRecaptcha) {
        setRecaptchaLoading(false);
        setRecaptchaFailed(true);
        setShowV2(true); // Automatically show v2 as fallback
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [executeRecaptcha]);

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      let token = null;

      // v3 recaptcha
      if (executeRecaptcha && !showV2 && !recaptchaFailed) {
        token = await executeRecaptcha("contact_form");

        if (!token) {
          setShowV2(true);
          return;
        }
      }

      // v2 fallback (or if v3 failed to load)
      if (showV2) {
        if (!v2Token) {
          alert("Please complete the CAPTCHA");
          return;
        }
        token = v2Token;
      }

      formData.append("captchaToken", token);
      // no await since it does not return a promise, instead react schedules the server action
      formAction(formData);
      // server errors will appear in state.error since server actions are not promises
    } catch (err) {
      console.error("Client-side error:", err);
      // If v3 throws an error, fall back to v2
      if (!showV2) {
        setShowV2(true);
        setRecaptchaFailed(true);
      }
    }
  }

  return (
    <>
      <div className="flex mt-8 justify-center text-subtleWhite">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col max-w-md w-full rounded-2xl shadow-lg"
        >
          {/* 2 HONEYPOT FIELDS - Hidden from humans, filled by bots */}
          <input
            type="text"
            name="website"
            tabIndex="-1"
            autoComplete="off"
            style={{
              position: "absolute",
              left: "-9999px",
              width: "1px",
              height: "1px",
            }}
            aria-hidden="true"
          />
          <input
            type="text"
            name="phone"
            tabIndex="-1"
            autoComplete="off"
            style={{
              position: "absolute",
              left: "-9999px",
              width: "1px",
              height: "1px",
            }}
            aria-hidden="true"
          />

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

          {recaptchaLoading && (
            <span className="text-center text-sm text-gray-400 mt-2">
              Loading security verification...
            </span>
          )}

          {recaptchaFailed && !showV2 && (
            <div className="text-center mt-2">
              <p className="text-yellow-500 text-sm mb-2">
                Security verification couldn&apos;t load.
              </p>
              <button
                type="button"
                onClick={() => setShowV2(true)}
                className="text-blue-500 underline text-sm"
              >
                Use backup verification instead
              </button>
            </div>
          )}
          {/* fallback CAPTCHA */}
          {showV2 && (
            <div className="flex flex-col items-center my-3">
              {recaptchaFailed && (
                <p className="text-sm text-gray-400 text-center mb-2">
                  Using backup verification method
                </p>
              )}
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY}
                onChange={(token) => setV2Token(token)}
              />
            </div>
          )}

          <GeneralButton
            type="submit"
            disabled={isPending || recaptchaLoading}
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
            value={formStartTime.current}
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
