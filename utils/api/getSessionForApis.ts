import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { serverAuthOptions } from "@/lib/auth";

type GetSessionOptions = {
  req?: Request;
  res?: unknown;
};

type GetSessionSuccess = { ok: true; session: Session };
type GetSessionFailure = { ok: false; response: Response };

export type GetSessionResult = GetSessionSuccess | GetSessionFailure;

export async function getSessionForApis(
  _options?: GetSessionOptions,
): Promise<GetSessionResult> {
  const session = await getServerSession(serverAuthOptions);

  if (!session) {
    return {
      ok: false,
      response: Response.json(
        { message: "Not authenticated" },
        { status: 401 },
      ),
    };
  }

  return { ok: true, session };
}
