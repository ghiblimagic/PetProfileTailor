import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { serverAuthOptions } from "@/lib/auth";
import AdminWrapper from "@/wrappers/AdminWrapper";

export default async function ProtectedLayout({ children }) {
  const session = await getServerSession(serverAuthOptions);

  // console.log("session", session);

  if (!session) redirect("/login");

  const { role, status } = session.user || {};

  // console.log("role", role, "status", status);

  const isAdmin = role === "admin" && status === "active";

  if (!isAdmin) redirect("/dashboard");

  return <AdminWrapper isAdmin={isAdmin}>{children}</AdminWrapper>;
}
