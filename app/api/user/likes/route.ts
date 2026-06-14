/**
 * Current user's liked name/description ids for LikesContext.
 * Notes: docs/notes/app/api/user-likes-route.md
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { serverAuthOptions } from "@/lib/auth";
import { getUserLikesForUserId } from "@/utils/api/getUserLikes";

export type {
  UserLikeEntry,
  UserLikesResponse,
} from "@/utils/api/getUserLikes";

export async function GET() {
  try {
    // Get the current user session
    const session = await getServerSession(serverAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await getUserLikesForUserId(session.user.id);
    return NextResponse.json(body);
  } catch (err) {
    console.error("Error fetching likes:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
