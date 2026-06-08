import type { Session } from "next-auth";
import type { Types } from "mongoose";
import { getSessionForApis } from "./getSessionForApis";

type CheckOwnershipParams = {
  req?: Request;
  res?: unknown;
  resourceCreatorId: string | Types.ObjectId;
};

type CheckOwnershipSuccess = { ok: true; session: Session };
type CheckOwnershipFailure = { ok: false };

export type CheckOwnershipResult = CheckOwnershipSuccess | CheckOwnershipFailure;

export async function checkOwnership({
  resourceCreatorId,
}: CheckOwnershipParams): Promise<CheckOwnershipResult> {
  const auth = await getSessionForApis();

  if (!auth.ok) {
    return { ok: false };
  }

  const user = auth.session.user;
  const isTheCreator = resourceCreatorId.toString() === user.id;
  const isActiveAdmin = user.role === "admin" && user.status === "active";

  if (!(isTheCreator || isActiveAdmin)) {
    return { ok: false };
  }

  return { ok: true, session: auth.session };
}
