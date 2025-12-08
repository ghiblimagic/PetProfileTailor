import User from "@models/User";
import db from "@utils/db";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import cloudinary from "@/utils/api/cloudinary";

function extractCloudinaryId(url) {
  try {
    const parts = url.split("/upload/")[1].split(".")[0];
    const endingPart = parts.replace(/^v\d+\//, "");
    console.log("image, api route endingPart", endingPart);
    return endingPart;
    // example "profileimage/uj1qca1lcdz3wad9qefi"
  } catch {
    return null;
  }
}

export async function PUT(req) {
  const { ok, session } = await getSessionForApis({ req });
  if (!ok) {
    return new Response(
      JSON.stringify({
        message: "Failed to update profile image! User is not authenticated",
      }),
      {
        status: 401,
      },
    );
  }

  await db.connect();
  const userId = session.user.id;
  const { newProfileImage } = await req.json();

  if (!newProfileImage) {
    return new Response(
      JSON.stringify({
        message:
          "Failed to update profile image! No new profile image link found.",
      }),
      {
        status: 400,
      },
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    return new Response(
      JSON.stringify({
        message: "Failed to update profile image! User not found",
      }),
      {
        status: 404,
      },
    );
  }

  const oldCloudinaryId = extractCloudinaryId(user.profileImage);
  const newCloudinaryId = extractCloudinaryId(newProfileImage);
  console.log("image in api route oldCloudinaryId", oldCloudinaryId);

  try {
    user.profileImage = newProfileImage;
    await user.save();

    //Delete old image only if different from the new one, after successfully saving the new one
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
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error("Failed to update user:", err);

    // Rollback: delete newly uploaded image to avoid orphaning
    if (newCloudinaryId) {
      try {
        await cloudinary.uploader.destroy(newCloudinaryId);
        console.log(
          "Rolled back: deleted new image since there was an error when saving it to the user",
        );
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
