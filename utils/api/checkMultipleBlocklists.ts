import { checkBlocklists, type BlocklistType } from "@/lib/checkBlocklist";
import bannedWordsMessage from "@/utils/api/bannedWordsMessage";

type FieldToCheck = {
  value: string;
  fieldName: string;
};

type BlockResult = {
  fieldName: string;
  value: string;
  blockedBy: string;
  blockType: BlocklistType;
};

export function checkMultipleFieldsBlocklist(
  fields: FieldToCheck[],
): BlockResult | null {
  for (const { value, fieldName } of fields) {
    const { allowed, blockedBy, type: blockType } = checkBlocklists(value);
    if (!allowed) {
      return {
        fieldName,
        value,
        blockedBy: blockedBy ?? "",
        blockType: blockType ?? "banned-everywhere",
      };
    }
  }
  return null;
}

export function respondIfBlocked(blockResult: BlockResult | null): Response | null {
  if (!blockResult) return null;

  const { value, fieldName, blockedBy, blockType } = blockResult;
  return Response.json(
    {
      message: bannedWordsMessage(value, fieldName, blockedBy, blockType),
      blockedBy,
    },
    { status: 403 },
  );
}
