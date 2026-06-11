/**
 * Current user's active suggestions for SuggestionsContext.
 * Notes: docs/notes/app/api/suggestion-route.md
 */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@utils/db";
import Suggestion from "@/models/Suggestion";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import { getServerSession } from "next-auth";
import { serverAuthOptions } from "@/lib/auth";

export type UserSuggestionEntry = {
  contentId?: string;
  _id?: string;
  status?: string;
};

export type UserSuggestionsResponse = {
  names: UserSuggestionEntry[];
  descriptions: UserSuggestionEntry[];
};

export async function GET() {
  try {
    const session = await getServerSession(serverAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    await dbConnect.connect();

    const [nameSuggestions, descriptionSuggestions] = await Promise.all([
      leanWithStrings(
        Suggestion.find(
          {
            suggestionBy: userId,
            status: { $nin: ["dismissed", "deleted", "resolved"] },
            contentType: "names",
          },
          { contentId: 1, status: 1, _id: 1 },
        ),
      ),
      leanWithStrings(
        Suggestion.find(
          {
            suggestionBy: userId,
            status: "pending",
            contentType: "descriptions",
          },
          { contentId: 1, status: 1, _id: 0 },
        ),
      ),
    ]);

    return NextResponse.json({
      names: (nameSuggestions ?? []) as UserSuggestionEntry[],
      descriptions: (descriptionSuggestions ?? []) as UserSuggestionEntry[],
    } satisfies UserSuggestionsResponse);
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
