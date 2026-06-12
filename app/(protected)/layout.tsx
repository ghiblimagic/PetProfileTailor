/**
 * Protected route group — requires signed-in session.
 * Notes: docs/notes/app/protected-layout.md
 */
import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { serverAuthOptions } from "@/lib/auth";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await getServerSession(serverAuthOptions);

  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}
