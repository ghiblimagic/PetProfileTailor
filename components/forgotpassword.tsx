/**
 * Forgot password form.
 * Notes: docs/notes/app/auth-pages.md
 */
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaw } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import Image from "next/image";
import StyledInput from "./FormComponents/StyledInput";

function isValidEmail(email: string) {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
}

export default function ForgotPassword() {
  // useSession — redirect if user signs in while on this page
  const { data: session } = useSession();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    // if session exists, user is already signed in
    if (session?.user) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = (e.currentTarget.elements.namedItem("signinemail") as HTMLInputElement)
      .value;

    if (!isValidEmail(email)) {
      setMessage("Email is invalid");
      return;
    }

    try {
      const res = await fetch("/api/forgotpassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      // for safety, we won't give any hints if this email exists in the database or not
      if (res.status === 404 || res.status === 200) {
        setMessage(
          "If an account is registered to this email, a reset password link will be sent to this email",
        );
        setError(false);
      } else {
        setError(true);
        setMessage(
          "Error reaching api path for forgot password, refresh page and try again",
        );
      }
    } catch (err) {
      setMessage(
        "Error reaching api path for forgot password, refresh page and try again",
      );
      setError(true);
      console.log(err);
    }
  };

  return (
    <div className=" mx-auto">
      <section className="h-fit">
        <div className="px-6 h-full text-gray-100">
          <div className="flex justify-center items-center flex-wrap ">
            <div className=" xl:w-3/12 lg:w-3/12 w-4/12 lg:my-12  mr-10">
              <Image
                src="/lostpasswordsquirrel.jpg"
                className="w-full rounded-full shadow-lg"
                width={200}
                height={200}
                alt="A squirrel with a poofy tail looking suprised"
                unoptimized
                sizes="100vw"
                style={{
                  width: "100%",
                  height: "auto",
                }}
              />
            </div>

            <div className="xl:w-5/12 lg:w-5/12 md:w-8/12 mb-12 md:mb-0 mt-2">
              <form
                className="mx-auto max-w-screen-md"
                onSubmit={handleSubmit}
              >
                <div className="text-center text-2xl mb-4">
                  Forgot Password{" "}
                </div>

                <p className="pb-4">
                  Aww nuts! Forgot your password? Don&apos;t worry you can reset
                  it here.
                </p>

                {/* <!-- Email input --> */}
                <div className="mb-6">
                  <label htmlFor="signinemail">Email</label>

                  <StyledInput
                    id="signinemail"
                    type="text"
                    placeholder="Email"
                    required
                    className="ml-2"
                  />

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
                    Submit
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
    </div>
  );
}
