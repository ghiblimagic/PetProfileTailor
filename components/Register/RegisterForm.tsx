"use client";

import React, { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import axios, { isAxiosError } from "axios";
import GeneralButton from "@components/Shared/actions/GeneralButton";
import Image from "next/image";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotions";
import ReCAPTCHA from "react-google-recaptcha";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  E2E_CAPTCHA_BYPASS_TOKEN,
  isE2eClientMode,
} from "@/utils/api/e2eTestMode";
import type { SignupFieldErrors } from "@/utils/api/validateSignupSubmission";
import RegisterInput from "@components/FormComponents/RegisterInput";
import LoadingSpinner from "@/components/Shared/ui/LoadingSpinner";

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  profilename: string;
  confirmPassword: string;
  over13: boolean;
};

type SignupApiResponse = {
  captchaLowScore?: boolean;
  message?: string;
  errors?: SignupFieldErrors;
};

export default function RegisterForm() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isE2eTestMode = isE2eClientMode();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [showV2, setShowV2] = useState(false);
  const [v2Token, setV2Token] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [namesThatExist, setNamesThatExist] = useState<unknown[] | null>(null);
  const [nameCheck, setNameCheck] = useState("");
  const [nameCheckFunctionRun, setNameCheckFunctionRun] = useState(false);
  const { data: session } = useSession();

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    if (session?.user) {
      router.push(redirect || "/dashboard");
    }
  }, [router, session, redirect]);

  const imageSrc = prefersReducedMotion
    ? "/welcometothepack_static.png"
    : "/welcometothepack.webp";

  async function checkIfNameExists() {
    const nameResponse = await fetch(
      "/api/user/getASpecificUserByProfileName/" + nameCheck,
    );
    const nameData = await nameResponse.json();

    setNamesThatExist(nameData);
    setNameCheckFunctionRun(true);
  }

  function resetData(e: React.ChangeEvent<HTMLInputElement>) {
    setNameCheck(e.target.value.toLowerCase());
    setNameCheckFunctionRun(false);
    setNamesThatExist(null);
  }

  const {
    handleSubmit,
    register,
    getValues,
    setError,
    formState: { errors },
    watch,
  } = useForm<RegisterFormValues>();

  const submitHandler = async ({
    name,
    email,
    password,
    profilename,
    over13,
  }: RegisterFormValues) => {
    let captchaToken: string | undefined;
    setIsLoading(true);

    try {
      if (!over13) {
        setError("over13", {
          type: "manual",
          message: "You must confirm you are over 13",
        });
        setIsLoading(false);
        return;
      }
      if (isE2eTestMode) {
        captchaToken = E2E_CAPTCHA_BYPASS_TOKEN;
      } else if (!executeRecaptcha && !v2Token) {
        setIsLoading(false);
        toast.error("reCAPTCHA is not ready. Please try again.");
        return;
      } else if (!showV2) {
        captchaToken = await executeRecaptcha!("register");

        if (!captchaToken) {
          setShowV2(true);
          setIsLoading(false);
          return;
        }
      } else {
        if (!v2Token) {
          alert("Please complete the CAPTCHA");
          setIsLoading(false);
          return;
        }
        captchaToken = v2Token;
      }

      const res = await axios.post<SignupApiResponse>("/api/auth/signup", {
        name,
        email,
        password,
        over13,
        profileName: profilename.toLowerCase(),
        captchaToken,
      });

      if (res.data?.captchaLowScore) {
        setShowV2(true);
        return;
      }

      if (password === "") {
        const magicLinkSignUp = await signIn("email", {
          redirect: false,
          email,
        });
        if (!magicLinkSignUp) {
          setIsLoading(false);
          toast.error("Magic link sign in failed. Please try again.");
        } else if (magicLinkSignUp.error) {
          setIsLoading(false);
          toast.error(magicLinkSignUp.error);
        } else {
          toast.success(
            "Successfully signed up! A magic link has been sent to your email",
          );
          router.push(`/magiclink?email=${encodeURIComponent(email)}`);
        }
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!result) {
        setIsLoading(false);
        toast.error("Sign in failed. Please try again.");
      } else if (result.error) {
        setIsLoading(false);
        toast.error(result.error);
      } else {
        toast.success("Successfully signed up! Sending to dashboard");
        router.push("/dashboard");
      }
    } catch (err) {
      if (isAxiosError<{ errors?: SignupFieldErrors; message?: string }>(err)) {
        const apiErrors = err.response?.data?.errors;

        if (apiErrors) {
          Object.entries(apiErrors).forEach(([field, message]) => {
            setError(field as keyof RegisterFormValues, {
              type: "server",
              message: String(message),
            });
          });
          setIsLoading(false);
        } else {
          setIsLoading(false);
          toast.error(err.response?.data?.message || "Something went wrong");
        }
      } else {
        setIsLoading(false);
        toast.error("Something went wrong");
      }
    }
  };

  const passwordEntered = watch("password");

  return (
    <div className="h-fit text-subtleWhite">
      <h1 className="flex justify-center text-3xl mb-1"> Register </h1>
      <div className="flex justify-center">
        <Image
          src={imageSrc}
          alt="A dog is highfiving a human hand and the text on the bottom says welcome to the pack!"
          width={220}
          height={220}
          style={{
            maxWidth: "100%",
            height: "auto",
            borderRadius: 30,
          }}
        />
      </div>
      <h2 className="my-4 text-2xl text-center">Create Account</h2>
      <section className="bg-secondary px-4 mb-2 text-center mx-auto py-6 max-w-screen-md ">
        <p className=" pb-2 font-bold text-lg border-b-2 border-white mb-2">
          Do you prefer passwordless sign in?
        </p>

        <p className="mb-2">
          {" "}
          Then good news! You can sign in using a magic link!
        </p>
        <p className="mb-2">
          We’ll send a “magic” link to your email, and clicking the link is all
          it takes to log in.
        </p>

        <p className="mb-4">
          However, we <strong> recommend </strong> magic link users also add a
          password when signing up. Think of it as a little extra leash for your
          account. That way, you won’t get locked out if your email wanders off!
        </p>

        <p className="mb-4">
          If you decide you want to add a password later,
          <strong> you can add a password in settings. </strong>
        </p>
      </section>
      <form
        className="max-w-screen-md text-center mx-auto"
        onSubmit={handleSubmit(submitHandler)}
      >
        <div className="flex flex-col gap-2 items-center my-4">
          <p>
            {" "}
            Due to the community nature of this app and the possibility of
            lightly suggestive or controversial content, users must be over 13.{" "}
          </p>
          <div>
            <input
              id="over13"
              type="checkbox"
              {...register("over13", {
                required: "You must confirm you are over 13",
              })}
              className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label
              htmlFor="over13"
              className="ml-2 text-subtleWhite"
            >
              I confirm that I am over 13 years old
            </label>
          </div>
        </div>
        {errors.over13 && (
          <p className="text-red-500 text-sm mt-1">{errors.over13.message}</p>
        )}

        <RegisterInput
          id="name"
          label="User Name"
          type="text"
          register={register}
          validation={{ required: "Please enter a name" }}
          error={errors.name}
          helperText={[
            "Valid characters: any",
            <p key="changeable">
              <strong>Can</strong> be changed later
            </p>,
            "30 characters max",
          ]}
          inputStyling=""
        />

        <RegisterInput
          id="profilename"
          label="Profile Name"
          type="text"
          className="lowercase"
          maxLength={30}
          autoFocus
          register={register}
          validation={{
            required: "Please enter a profilename",
            validate: (value: string | boolean) => {
              if (typeof value !== "string") return true;
              return (
                value.match(/[^a-z\d&'-]+/) == null ||
                `Invalid characters entered: ${value.match(/[^a-z\d&'-]+/g)}`
              );
            },
          }}
          error={errors.profilename}
          inputStyling="w-full"
          helperText={[
            "CAN'T be changed later, it will be unique to you.",
            "Valid characters: a-z, numbers, &, ' and -",
            "30 characters max.",
          ]}
        />

        <RegisterInput
          id="email"
          label="Email"
          type="email"
          register={register}
          validation={{
            required: "Please enter an email",
            pattern: {
              value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$/i,
              message: "Please enter a valid email",
            },
          }}
          inputStyling="w-full"
          error={errors.email}
        />

        <RegisterInput
          id="password"
          autoFocus
          label="Password"
          type="password"
          register={register}
          validation={{
            minLength: {
              value: 6,
              message: "password must be more than 5 chars",
            },
          }}
          error={errors.password}
          inputStyling="w-full"
          helperText="Recommended but not required for magic link users"
        />

        <RegisterInput
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          register={register}
          validation={{
            required: passwordEntered && "This field is required",
            validate: (value: string | boolean) => {
              if (typeof value !== "string") return true;
              return value === getValues("password") || "Passwords do not match";
            },
            minLength: {
              value: 6,
              message: "Confirm password must be more than 5 chars",
            },
          }}
          inputStyling="w-full"
          helperText="Recommended but not required for magic link users"
          error={errors.confirmPassword}
        />

        <div className="w-full flex justify-center mb-4">
          <GeneralButton
            text="register"
            disabled={isLoading}
          />
        </div>
        {showV2 && (
          <div className="flex justify-center mb-4">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY!}
              onChange={(token: string | null) => setV2Token(token)}
            />
          </div>
        )}
      </form>
      {isLoading && <LoadingSpinner />}
    </div>
  );
}
