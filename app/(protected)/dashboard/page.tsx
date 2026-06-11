/**
 * Protected dashboard route — loads add counts for signed-in user.
 * Notes: docs/notes/app/dashboard-page.md
 */
import dbConnect from "@utils/db";
// Register tag models for Mongoose populate on `tags`
import "@/models/NameTag";
import "@/models/DescriptionTag";
import Names from "@models/Name";
import Description from "@/models/Description";
import Dashboard from "@/components/dashboard";
import { serverAuthOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { leanWithStrings } from "@/utils/mongoDataCleanup";

export default async function DashboardPage() {
  const session = await getServerSession(serverAuthOptions);

  if (!session?.user) {
    redirect("/login");
  }
  const userId = session.user.id;

  await dbConnect.connect();

  // ---- NAMES created by user ----
  const namesCreated =
    (await leanWithStrings(
      Names.find({ createdBy: userId })
        .populate({
          path: "createdBy",
          select: ["name", "profileName", "profileImage"],
        })
        .populate({ path: "tags" }),
    )) ?? [];

  // ---- DESCRIPTIONS created by user ----
  const createdDescriptions =
    (await leanWithStrings(
      Description.find({ createdBy: userId })
        .populate({
          path: "createdBy",
          select: ["name", "profileName", "profileImage"],
        })
        .populate({ path: "tags" }),
    )) ?? [];

  return (
    <Dashboard
      namesCreated={namesCreated}
      createdDescriptions={createdDescriptions}
    />
  );
}
