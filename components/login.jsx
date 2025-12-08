"use client";

import React, { useEffect, useState, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { getError } from "@utils/error";
import { toast } from "react-toastify";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaw } from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";

import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";

import Image from "next/image";
import NounBlackCatIcon from "@components/ReusableSmallComponents/iconsOrSvgImages/svgImages/NounBlackCatIcon";
import RegisterInput from "@components/FormComponents/RegisterInput";
import StyledInput from "@components/FormComponents/StyledInput";
import LinkButton from "@components/ReusableSmallComponents/buttons/LinkButton";
import { useRouter, useSearchParams } from "next/navigation";
import { getCsrfToken } from "next-auth/react";
import LoadingSpinner from "./ui/LoadingSpinner";
import { useLocalStorageCooldown } from "@/hooks/useLocalStorageCooldown";

export default function Login() {
  const { data: session } = useSession();
  const { canClick, formattedTimer, trigger } = useLocalStorageCooldown(
    `lastRecheck-MagicLink}`,
    120,
  );

  const [csrfToken, setCsrfToken] = useState("");
  const [redirect, setRedirect] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingMagicLink, setLoadingMagicLink] = useState(false);

  const hasShownError = useRef(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (!hasShownError.current) {
      if (error === "Banned") {
        toast.error("This account has been banned. Contact support.");
        hasShownError.current = true;
      } else if (error === "UserNotFound") {
        toast.error("User not found.");
        hasShownError.current = true;
      }
    }
  }, [error]);

  useEffect(() => {
    let isMounted = true;
    getCsrfToken().then((token) => {
      if (isMounted) setCsrfToken(token ?? "");
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!redirect) return;
    if (session) {
      // Use a microtask Promise.resolve() to avoid interfering with render
      Promise.resolve().then(() => router.replace("/dashboard"));
    }
    setRedirect(false);
    //Wrapping in Promise.resolve() defers the push until after the current render, preventing multiple “history” calls.
  }, [redirect]);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const submitHandler = async ({ email, password }) => {
    // console.log("email", email, "password", password);
    if (!email || !password) return;

    try {
      setLoadingLogin(true);
      const result = await signIn("credentials", {
        redirect: false,
        //gets rid of callback url @10:20 https://www.youtube.com/watch?v=EFucgPdjeNg&t=594s&ab_channel=FullStackNiraj
        email,
        password,
      });
      if (result.error) {
        setLoadingLogin(false);
        toast.error(result.error);
      } else {
        toast.success("Successfully signed in! Sending to dashboard");
      }
      setRedirect(true);
    } catch (err) {
      toast.error(getError(err));
      setLoadingLogin(false);
    }
  };

  return (
    <section className="h-fit  mx-auto ">
      <div className="px-6 h-full text-gray-100">
        <div className="flex lg:justify-between xl:justify-center  justify-center items-center flex-wrap h- g-6">
          <div className="grow-0 shrink-1 md:shrink-0 basis-auto lg:w-6/12 md:w-9/12 my-3 md:mb-0">
            <Image
              src="https://cdn.pixabay.com/photo/2020/03/31/16/17/animal-4988403_960_720.jpg"
              className="max-w-[300px] lg:max-w-lg rounded-full shadow-lg border-2 border-yellow-300 border-dashed mx-auto"
              width={200}
              height={200}
              alt="A guinea pig looks at the screen calmly as it sits on a keyboard"
              unoptimized
              sizes="100vw"
              style={{
                width: "100%",
                height: "auto",
              }}
            />
          </div>

          {/* ################ Right Side Section with login #################### */}
          <div className="xl:ml-20 xl:w-5/12 lg:w-5/12 md:w-8/12 mb-12 md:mb-0 md:mt-3 lg:mt-0">
            <form
              className="mx-auto max-w-screen-md"
              onSubmit={handleSubmit(submitHandler)}
            >
              <div className="flex justify-center text-2xl my-4 "> Login </div>

              {/* <!-- Email input --> */}

              <RegisterInput
                id="email"
                label="Email"
                type="email"
                autoFocus
                labelStyling="text-center"
                inputStyling="flex mx-auto "
                register={register}
                validation={{
                  required: "Please enter email",
                  pattern: {
                    value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/i,
                    message: "Please enter valid email",
                  },
                }}
                error={errors.email}
              />

              <RegisterInput
                id="password"
                label="Password"
                type="password"
                labelStyling="text-center"
                inputStyling="flex mx-auto "
                register={register}
                validation={{
                  required: "Please enter password",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                }}
                error={errors.password}
              />

              {/* ############# Forgot Password ################### */}

              <div className="flex justify-center mb-2">
                <span> Forgot? </span>

                <LinkButton
                  text="Click here"
                  href="/forgotpassword"
                  className="underline-offset-4 underline hover:border-b-2 hover:text-slate-300 hover:border-text-slate-300 ml-2"
                />
              </div>

              <div className="text-center">
                <GeneralButton
                  text="sign in"
                  className=""
                  type="submit"
                  subtle
                  disabled={loadingLogin}
                />
              </div>
            </form>

            {loadingLogin && <LoadingSpinner />}

            {/* ################ Or Divider ##################### */}

            <div className="flex items-center my-4 before:flex-1 before:border-t before:border-gray-300 before:mt-0.5 after:flex-1 after:border-t after:border-gray-300 after:mt-0.5">
              <p className="text-center font-semibold mx-4 mb-0">Or</p>
            </div>

            {/* ################ Magic Link ##################### */}

            <section className="bg-secondary p-2 ">
              <div className="flex justify-center py-2">
                <NounBlackCatIcon fill="purple" />
              </div>
              <h4 className="text-center  pb-1 font-semibold ">
                Login with a magic link
              </h4>
              <p className="text-center mb-2 pb-4 font-semibold border-b-2 border-white">
                {" "}
                (for registered users){" "}
              </p>

              <form
                className="text-center"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const email = form.email.value;
                  const honeypot = form.website.value;

                  if (honeypot) {
                    console.warn("Bot detected — honeypot field was filled.");
                    return;
                  }

                  if (!email) return toast.error("Please enter your email.");
                  setLoadingMagicLink(true);

                  if (!canClick) {
                    toast.error(
                      "Please wait a few seconds before trying again.",
                    );
                    return;
                  }

                  try {
                    const result = await signIn("email", {
                      email,
                      redirect: false, // we’ll handle redirect manually
                    });

                    if (result) {
                      // we want them sent to the magic link, no matter the result
                      router.push(
                        `/magiclink?email=${encodeURIComponent(email)}`,
                      );
                      toast("If this email exists, a magic link will be sent.");
                    }
                    trigger(); // will start cooldown
                  } catch (error) {
                    console.log("error in login", error);
                    toast.error("Something went wrong. Please try again.");
                  } finally {
                    setLoadingMagicLink(false);
                  }
                }}
              >
                <input
                  name="csrfToken"
                  type="hidden"
                  defaultValue={csrfToken}
                />
                <StyledInput
                  type="email"
                  id="magiclinkemail"
                  name="email"
                  className="lg:min-w-64 mt-4 "
                />

                <input
                  type="text"
                  name="website"
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <GeneralButton
                  text={canClick ? "Sign in" : `Wait ${formattedTimer}`}
                  className="sm:ml-2 sm:mb-2 text-center mt-0"
                  type="submit"
                  subtle
                  disabled={loadingMagicLink || !canClick}
                />
              </form>

              {loadingMagicLink && <LoadingSpinner />}

              <p className="text-center mb-2">Sign in without a password!</p>
              <p className="text-center mb-2">
                We&apos;ll send a magic link to this email, so you can click the
                link to sign in.
              </p>

              <p className="text-center">
                <strong> No email? </strong> Please check for typos and check
                your spam folder.
              </p>
            </section>

            {/* ################ Divider ##################### */}

            {/* <!-- Registration Link--> */}

            <section className="  my-4">
              <div className="font-semibold mt-2 pt-1 mb-0 text-center">
                <FontAwesomeIcon
                  className="fa-bounce text-yellow-300 mr-2 text-xl "
                  icon={faPaw}
                />
                <p className="mb-4">Don&apos;t have an account? Welcome! </p>

                <LinkButton
                  href={`/register`}
                  defaultStyle
                  text="Register"
                />
              </div>

              <small className="text-center  w-full inline-block py-2 mt-4">
                <a
                  href="https://thenounproject.com/browse/icons/term/magic/"
                  title="magic Icons"
                >
                  Magic by Monkik from Noun Project{" "}
                </a>
              </small>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
