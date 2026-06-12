/**
 * Forgot password route — redirects signed-in users.
 * Notes: docs/notes/app/auth-pages.md
 */
import ForgotPassword from "@/components/forgotpassword";
import { serverAuthOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ForgotPasswordPage() {
  const session = await getServerSession(serverAuthOptions);
  // if session exists, user is already signed in — send to dashboard

  if (session?.user) {
    redirect("/dashboard");
  }

  return <ForgotPassword />;
}
