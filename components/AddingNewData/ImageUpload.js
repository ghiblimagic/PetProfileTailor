"use client";

import React, { useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";
import DisabledButton from "@components/ReusableSmallComponents/buttons//DisabledButton";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";
import Image from "next/image";
import { useSession } from "next-auth/react";
import LoadingSpinner from "../ui/LoadingSpinner";
import SmallCenteredHeading from "@/components/ReusableSmallComponents/TitlesOrHeadings/SmallCenteredheading";

function ImageUpload({ setAvatar = false, setShowDialog = false }) {
  const { data: session, update } = useSession();
  const fileInputRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState();
  const [newProfileImage, setNewProfileImage] = useState("");
  const [imagePreview, setImagePreview] = useState();
  const [uploadingImage, setUploadingImage] = useState(false);

  // console.log(session);
  const handleImageAttachment = (e) => {
    e.preventDefault();
    setSelectedImage(e.target.files[0]);
    setImagePreview(URL.createObjectURL(e.target.files[0]));
  };

  // ########## upload image to cloudinary #############

  const handleImageUpload = async () => {
    if (!selectedImage) return;
    setUploadingImage(true);

    const formData = new FormData();

    formData.append("file", selectedImage);
    formData.append("userId", session.user.id);
    formData.append("upload_preset", "noyhrbxs");

    const data = await fetch(
      "https://api.cloudinary.com/v1_1/dujellms1/image/upload",
      {
        method: "POST",
        body: formData,
      },
    ).then((r) => r.json());

    let profileImage = data.secure_url;

    setNewProfileImage(profileImage);
    updateUserProfileImage(profileImage);
  };

  // ########## upload image to current users mongoDB user document  #############

  const updateUserProfileImage = async (newProfileImage) => {
    try {
      console.log(
        "image test, this is image upload newProfileimage",
        newProfileImage.toString(),
        "user",
        session.user.id,
      );
      let res = await axios.put("/api/user/uploadprofileimage", {
        newProfileImage: newProfileImage.toString(),
        user: session.user.id,
      });

      // Force a new token refresh, so the new profile image will show on the navBar
      const refreshed = await axios.post("/api/auth/session/refresh");
      await update({ user: refreshed.data });

      const message = res.data?.message || "Avatar updated!";

      if (fileInputRef.current) fileInputRef.current.value = "";

      if (res.status == 200) {
        toast.success(message);
        if (setAvatar) {
          setAvatar(newProfileImage.toString());
        }
        setSelectedImage("");
        setImagePreview("");
        setUploadingImage(false);

        if (setShowDialog) {
          setShowDialog(false);
        }
      } else {
        toast.error(`Error: ${message}`);
        setUploadingImage(false);
      }
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setUploadingImage(false);

      if (backendMessage) {
        toast.error(backendMessage);
      } else if (err.message) {
        toast.error(`An error occurred: ${err.message}`);
      } else {
        toast.error("Something went wrong updating your avatar.");
      }

      console.error("Error updating user profile image:", err);
    }
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
      {/* .gif. Gifs will
        appear as a still image until they are hovered over. */}
      <input
        ref={fileInputRef} // so the file name will disappear after its uploaded
        onChange={handleImageAttachment}
        accept=".jpg, .png, .jpeg, .webp"
        className="w-full text-center border-b-white"
        type="file"
      ></input>
      {/* styled in globals.css input::file-selector-button
       */}
      <div>
        {/* ##### IMAGE PREVIEW AREA  ######*/}
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
                  setSelectedImage("");
                  setImagePreview("");
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
              onClick={handleImageUpload}
              disabled={!selectedImage}
              className="bg-blue rounded-2xl"
              text="Upload"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ImageUpload;
