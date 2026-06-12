/**
 * Get/update current user (URL [id] ignored; uses session).
 * Notes: docs/notes/app/api/user-profile-routes.md
 */
import db from "@utils/db";
import User from "@models/User";
import { getSessionForApis } from "@/utils/api/getSessionForApis";

export async function GET(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) {
    return new Response(
      JSON.stringify({ success: false, message: "Not authenticated" }),
      { status: 401 },
    );
  }
  await db.connect();

  try {
    const user = await User.findById(auth.session.user.id);
    if (!user) {
      return new Response(JSON.stringify({ success: false }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, data: user }), {
      status: 200,
    });
  } catch {
    return new Response(JSON.stringify({ success: false }), { status: 400 });
  }
}

export async function PUT(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) {
    return new Response(
      JSON.stringify({ success: false, message: "Not authenticated" }),
      { status: 401 },
    );
  }

  await db.connect();

  const body = await req.json();

  try {
    const user = await User.findByIdAndUpdate(auth.session.user.id, body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return new Response(JSON.stringify({ success: false }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, data: user }), {
      status: 200,
    });
  } catch {
    return new Response(JSON.stringify({ success: false }), { status: 400 });
  }
}
