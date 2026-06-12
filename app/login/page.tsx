/**
 * Login route — redirects signed-in users to dashboard.
 * Notes: docs/notes/app/auth-pages.md
 */
import { serverAuthOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Login from "@components/login";

export default async function LoginScreen() {
  const session = await getServerSession(serverAuthOptions);
  // useSession on client still needed after sign-in; this gates already-signed-in visits

  if (session?.user) {
    redirect("/dashboard");
  }

  return <Login />;
}
