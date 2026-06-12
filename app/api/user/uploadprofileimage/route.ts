/**
 * Save Cloudinary profile image URL; delete old asset when replaced.
 * Notes: docs/notes/app/api/user-profile-routes.md
 */
import User from "@models/User";
import db from "@utils/db";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import cloudinary from "@/utils/api/cloudinary";

function extractCloudinaryId(url: string): string | null {
  try {
    const parts = url.split("/upload/")[1].split(".")[0];
    const endingPart = parts.replace(/^v\d+\//, "");
    return endingPart;
  } catch {
    return null;
  }
}

type UploadProfileImageBody = {
  newProfileImage?: string;
  user?: string;
};

export async function PUT(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) {
    return new Response(
      JSON.stringify({
        message: "Failed to update profile image! User is not authenticated",
      }),
      { status: 401 },
    );
  }

  await db.connect();
  const userId = auth.session.user.id;
  const { newProfileImage } = (await req.json()) as UploadProfileImageBody;

  if (!newProfileImage) {
    return new Response(
      JSON.stringify({
        message:
          "Failed to update profile image! No new profile image link found.",
      }),
      { status: 400 },
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    return new Response(
      JSON.stringify({
        message: "Failed to update profile image! User not found",
      }),
      { status: 404 },
    );
  }

  const oldCloudinaryId = extractCloudinaryId(user.profileImage ?? "");
  const newCloudinaryId = extractCloudinaryId(newProfileImage);

  try {
    user.profileImage = newProfileImage;
    await user.save();

    if (oldCloudinaryId && oldCloudinaryId !== newCloudinaryId) {
      try {
        await cloudinary.uploader.destroy(oldCloudinaryId);
      } catch (err) {
        console.error("Failed to delete old image:", err);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Avatar updated! ",
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error("Failed to update user:", err);

    if (newCloudinaryId) {
      try {
        await cloudinary.uploader.destroy(newCloudinaryId);
      } catch (cleanupErr) {
        console.error(
          "Failed to delete new image after save error:",
          cleanupErr,
        );
      }
    }

    return new Response(
      JSON.stringify({ message: "Failed to update profile image." }),
      { status: 500 },
    );
  }
}
