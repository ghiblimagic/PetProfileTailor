/**
 * Reset password form after email token verification.
 * Notes: docs/notes/app/auth-pages.md
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { getError } from "@utils/error";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaw } from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";
import Image from "next/image";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

type VerifiedUser = {
  _id: string;
  name: string;
  email: string;
};

export type ResetPasswordProps = {
  token: string;
};

export default function ResetPassword({ token }: ResetPasswordProps) {
  // useSession — redirect if already signed in
  const { data: session } = useSession();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userid, setId] = useState<string | null>(null);
  const [passwordAfterReset, setPasswordAfterReset] = useState<string | null>(
    null,
  );

  const {
    handleSubmit,
    register,
    getValues,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch("/api/verifyresetpasstoken", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (res.status === 404) {
          setMessage("Invalid reset token or token has expired");
          setError(true);
        } else if (res.status === 200) {
          setMessage("");
          setError(false);
          const userData = (await res.json()) as VerifiedUser;
          setName(userData.name);
          setEmail(userData.email);
          setId(userData._id);
        }
      } catch (err) {
        setMessage("Error, try again");
        setError(true);
        console.log(err);
      }
    };
    void verifyToken();
  }, [token]);

  useEffect(() => {
    // if session exists, user is already signed in
    if (session?.user) {
      router.push("/dashboard");
    }
  }, [router, session]);

  const loginAfterPasswordChange = useCallback(async () => {
    if (!email || !passwordAfterReset) return;

    try {
      // signIn handled by nextauth route — redirect: false like login credentials
      const result = await signIn("credentials", {
        redirect: false, // gets rid of callback url — https://www.youtube.com/watch?v=EFucgPdjeNg&t=594s
        email,
        password: passwordAfterReset,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Successfully signed in! Sending to dashboard");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(getError(err));
    }
  }, [email, passwordAfterReset, router]);

  useEffect(() => {
    if (passwordAfterReset != null) {
      void loginAfterPasswordChange();
    }
  }, [passwordAfterReset, loginAfterPasswordChange]);

  const submitHandler = async ({ password }: ResetPasswordFormValues) => {
    try {
      const res = await axios.put("/api/auth/update", {
        name,
        email,
        password,
        userid,
      });
      if (res.status === 422) {
        setMessage(
          "There was an error with validating the name, email or userid of this account",
        );
        setError(true);
      } else if (res.status === 400) {
        setMessage(
          "There was an unexpected error in the request method of the update API route for the reset password page",
        );
        setError(true);
      } else if (res.status === 200) {
        setMessage("Password updated successfully");
        setError(false);
        setPasswordAfterReset(password);
      }
    } catch (err) {
      setMessage(
        "There was an error with api route `auth update` for resetting your password, try again. If error persists contact us and send this error message",
      );
      setError(true);
      console.log(err);
    }
  };

  return (
    <section className="h-fit">
      <div className="px-6 h-full text-gray-100">
        <div className="flex justify-center items-center flex-wrap ">
          <div className=" xl:w-4/12 lg:w-4/12 md:w-5/12 mb-12 ">
            <Image
              src="/lostpasswordsquirrel.jpg"
              className="w-full rounded-full shadow-lg"
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

          <div className="ml-20 xl:w-5/12 lg:w-5/12 md:w-8/12 mb-12 md:mb-0">
            <form
              className="mx-auto max-w-screen-md"
              onSubmit={handleSubmit(submitHandler)}
            >
              <div className="text-center text-2xl mb-4">Reset Password </div>

              {/* <!-- Email input --> */}
              <div className="mb-6">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  disabled={error}
                  // if token expired / invalid, don't allow entering a password
                  className="w-full border border-gray-300 text-black rounded px-3 py-2 mb-4 focus:outline-none focus:border-blue-400 focus:text-black disabled:bg-errorBackgroundColor disabled:placeholder-errorTextColor"
                  placeholder="password"
                  required
                  id="password"
                  {...register("password", {
                    minLength: {
                      value: 6,
                      message: "password is more than 5 chars",
                    },
                  })}
                />

                <div className="mb-4">
                  <label
                    htmlFor="confirmPassword"
                    className="text-white"
                  >
                    Confirm New Password
                  </label>
                  <input
                    className="w-full text-secondary"
                    type="password"
                    id="confirmPassword"
                    {...register("confirmPassword", {
                      validate: (value) =>
                        value === getValues("password") ||
                        "Passwords do not match",
                      minLength: {
                        value: 6,
                        message: "confirm password is more than 5 chars",
                      },
                    })}
                  />
                  {errors.confirmPassword && (
                    <div className="text-red-500 ">
                      {errors.confirmPassword.message}
                    </div>
                  )}
                </div>

                {message && (
                  <div
                    className={`text-black ${
                      error ? "bg-red-300" : "bg-green-300"
                    } rounded-lg p-2 border-4 ${
                      error ? "border-red-700" : "border-green-700"
                    }`}
                    role="alert"
                  >
                    {message}
                  </div>
                )}
              </div>

              {/* <!-- Login Button --> */}
              <div className="text-center lg:text-left">
                <button
                  type="submit"
                  className="inline-block px-7 py-3 bg-blue-600 text-white font-medium text-sm leading-snug uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
                >
                  Reset Password
                </button>
              </div>
            </form>

            <div className="flex items-center my-4 before:flex-1 before:border-t before:border-gray-300 before:mt-0.5 after:flex-1 after:border-t after:border-gray-300 after:mt-0.5"></div>

            {/* <!-- Registration Link--> */}
            <p className="text-sm font-semibold mt-2 pt-1 mb-0 text-center">
              <FontAwesomeIcon
                className="fa-bounce text-yellow-300 mr-2 text-xl"
                icon={faPaw}
              />
              Don&apos;t have an account? Welcome! &nbsp;
              <Link
                href="/register"
                className="text-yellow-300 hover:text-indigo-200 focus:text-red-700 transition duration-200 ease-in-out"
              >
                Register by clicking here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
