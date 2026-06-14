/**
 * Cloudinary avatar upload + persist URL via API.
 * Notes: docs/notes/components/image-upload.md
 */
"use client";

import { useState, useRef, type ChangeEvent } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GeneralButton from "@components/Shared/actions/GeneralButton";
import DisabledButton from "@components/Shared/actions/DisabledButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";
import Image from "next/image";
import { useSession } from "next-auth/react";
import LoadingSpinner from "../Shared/ui/LoadingSpinner";
import SmallCenteredHeading from "@/components/Shared/typography/SmallCenteredHeading";
import type { SessionRefreshResponse } from "@/app/api/auth/session/refresh/route";

type CloudinaryUploadResponse = {
  secure_url?: string;
};

export type ImageUploadProps = {
  setAvatar?: (url: string) => void;
  setShowDialog?: (show: boolean) => void;
};

export default function ImageUpload({
  setAvatar,
  setShowDialog,
}: ImageUploadProps) {
  const { data: session, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageAttachment = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const updateUserProfileImage = async (profileImage: string) => {
    if (!session?.user?.id) return;

    try {
      const res = await axios.put("/api/user/uploadprofileimage", {
        newProfileImage: profileImage,
        user: session.user.id,
      });

      const refreshed = await axios.post<SessionRefreshResponse>(
        "/api/auth/session/refresh",
      );
      await update({ user: refreshed.data });

      const message = (res.data as { message?: string })?.message || "Avatar updated!";

      if (fileInputRef.current) fileInputRef.current.value = "";

      if (res.status === 200) {
        toast.success(message);
        setAvatar?.(profileImage);
        setSelectedImage(undefined);
        setImagePreview(undefined);
        setUploadingImage(false);
        setShowDialog?.(false);
      } else {
        toast.error(`Error: ${message}`);
        setUploadingImage(false);
      }
    } catch (err) {
      setUploadingImage(false);

      if (axios.isAxiosError(err)) {
        const backendMessage = err.response?.data as { message?: string } | undefined;
        if (backendMessage?.message) {
          toast.error(backendMessage.message);
        } else if (err.message) {
          toast.error(`An error occurred: ${err.message}`);
        } else {
          toast.error("Something went wrong updating your avatar.");
        }
      } else {
        toast.error("Something went wrong updating your avatar.");
      }

      console.error("Error updating user profile image:", err);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !session?.user?.id) return;
    setUploadingImage(true);

    const formData = new FormData();
    formData.append("file", selectedImage);
    formData.append("userId", session.user.id);
    formData.append("upload_preset", "noyhrbxs");

    const data = (await fetch(
      "https://api.cloudinary.com/v1_1/dujellms1/image/upload",
      {
        method: "POST",
        body: formData,
      },
    ).then((r) => r.json())) as CloudinaryUploadResponse;

    const profileImage = data.secure_url;
    if (!profileImage) {
      toast.error("Cloudinary upload failed.");
      setUploadingImage(false);
      return;
    }

    await updateUserProfileImage(profileImage);
  };

  return (
    <div className=" text-subtleWhite text-center ">
      <SmallCenteredHeading
        heading="Change Your Avatar"
        level="2"
      />

      <p className="my-4  text-center">
        Accepted image formats are jpg, jpeg, png and webp
      </p>
      <input
        ref={fileInputRef}
        onChange={handleImageAttachment}
        accept=".jpg, .png, .jpeg, .webp"
        className="w-full text-center border-b-white"
        type="file"
      />
      <div>
        {imagePreview && (
          <div className="flex justify-center">
            <div className="relative w-content">
              <Image
                className="object-scale-down mx-auto block"
                src={imagePreview}
                width={300}
                height={300}
                alt=""
                style={{
                  maxWidth: "100%",
                  height: "auto",
                }}
              />
              <FontAwesomeIcon
                icon={faCircleXmark}
                onClick={() => {
                  setSelectedImage(undefined);
                  setImagePreview(undefined);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-3xl text-yellow-300 mr-2 absolute top-4 right-2 justify-center drop-shadow-md"
              />
            </div>
          </div>
        )}

        {uploadingImage && <LoadingSpinner />}

        <div className="w-full text-center my-4">
          {selectedImage ? (
            <GeneralButton
              onClick={handleImageUpload}
              className="  text-center rounded-2xl w-24"
              text="Upload"
              disabled={uploadingImage}
            />
          ) : (
            <DisabledButton
              className="bg-blue rounded-2xl"
              text="Upload"
            />
          )}
        </div>
      </div>
    </div>
  );
}
