import { getSessionForApis } from "./getSessionForApis";
import type { Session } from "next-auth";

type AppUser = Session["user"] & {
  role?: string;
  status?: string;
};

type CheckIfAdminParams = {
  req?: Request;
};

type CheckIfAdminSuccess = { ok: true; session: Session };
type CheckIfAdminFailure = { ok: false; response: Response };

export type CheckIfAdminResult = CheckIfAdminSuccess | CheckIfAdminFailure;

export async function checkIfAdmin(
  _params: CheckIfAdminParams = {},
): Promise<CheckIfAdminResult> {
  const auth = await getSessionForApis();

  if (!auth.ok) {
    return auth;
  }

  const { role, status } = (auth.session.user ?? {}) as AppUser;
  const isAdmin = role === "admin" && status === "active";

  if (!isAdmin) {
    return {
      ok: false,
      response: Response.json(
        {
          message: "Unauthorized, you must be an admin to complete this action",
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, session: auth.session };
}
