/**
 * Reset password route — token from email link.
 * Notes: docs/notes/app/auth-pages.md
 */
import { getServerSession } from "next-auth";
import { serverAuthOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ResetPassword from "@/components/ResetPassword";

type ResetPasswordPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const session = await getServerSession(serverAuthOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  // allows us to grab the dynamic value from the url
  const { token } = await params;
  return <ResetPassword token={token} />;
}
