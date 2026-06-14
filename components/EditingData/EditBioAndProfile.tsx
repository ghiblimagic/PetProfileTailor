/**
 * Profile edit modal: bio, location, avatar upload.
 * Notes: docs/notes/components/edit-bio-and-profile.md
 */
"use client";

import { toast } from "react-toastify";
import axios from "axios";
import Image from "next/image";
import type { Session } from "next-auth";
import XSvgIcon from "@components/shared/icons/XSvgIcon";
import ImageUpload from "@components/AddingNewData/ImageUpload";
import GeneralButton from "../shared/actions/GeneralButton";
import StyledInput from "../FormComponents/StyledInput";
import StyledTextarea from "../FormComponents/StyledTextarea";
import type { ProfileUserData } from "@/components/profile";

export type EditBioAndProfileProps = {
  setShowProfileEditPage: (show: boolean) => void;
  userData: ProfileUserData;
  sessionFromServer: Session;
  setProfileChange: (changed: boolean) => void;
  setBio: (bio: string) => void;
  bio: string;
  setLocation: (location: string) => void;
  location: string;
  avatar: string;
  setAvatar: (url: string) => void;
};

export default function EditBioAndProfile({
  setShowProfileEditPage,
  sessionFromServer,
  setProfileChange,
  setBio,
  bio,
  setLocation,
  location,
  avatar,
  setAvatar,
}: EditBioAndProfileProps) {
  const bioSubmission = async () => {
    await axios
      .put("/api/user/editbiolocationavatar", {
        bioSubmission: {
          bio,
          location,
          userid: sessionFromServer.user.id,
        },
      })
      .then(() => {
        setProfileChange(true);
        setShowProfileEditPage(false);
        toast.success("Profile successfully updated!");
      })
      .catch((error) => {
        console.log("there was an error when sending your edits", error);
        toast.error("Ruh Roh! Profile not updated");
      });
  };

  return (
    <div>
      <div
        className="relative z-50"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div
            className="            
            p-4 text-center sm:items-center sm:p-0 
            max-w-3xl
            mx-auto my-2"
          >
            <div>
              <div className="relative">
                <XSvgIcon
                  screenReaderText="Close Edit Screen"
                  onClickAction={() => setShowProfileEditPage(false)}
                />

                <div
                  className="mx-auto flex flex-col font-semibold text-secondary bg-primary
                 border-2 border-violet-400 border-dotted 
                 p-4 shadow-lg max-w-3xl"
                >
                  <h4 className="text-subtleWhite mt-4"> location </h4>

                  <StyledInput
                    className="bg-secondary"
                    onChange={(e) => setLocation(e.target.value)}
                    value={location}
                    maxLength={70}
                    id="location"
                  />

                  <span className="text-subtleWhite">
                    {`${70 - location.length}/70 characters left`}
                  </span>

                  <h4 className="text-subtleWhite"> Bio </h4>

                  <StyledTextarea
                    onChange={(e) => setBio(e.target.value)}
                    required
                    maxLength={400}
                    value={bio}
                  />

                  <span className="text-subtleWhite">
                    {`${400 - bio.length}/400 characters left`}
                  </span>

                  <h4 className="text-subtleWhite mt-2">Current Avatar </h4>

                  <div className="h-28 w-28 flex justify-center items-center mx-auto">
                    <Image
                      src={avatar}
                      className=""
                      width={60}
                      height={60}
                      alt=""
                      style={{
                        width: "100%",
                        height: "auto",
                      }}
                    />
                  </div>

                  <ImageUpload
                    setAvatar={setAvatar}
                    setShowDialog={setShowProfileEditPage}
                  />
                </div>
              </div>
            </div>

            <div
              className="bg-secondary px-4 py-3
                 sm:px-6 grid grid-cols-2 justify-items-center"
            >
              <GeneralButton
                type="button"
                text="save"
                subtle
                onClick={() => void bioSubmission()}
                className="justify-center w-28"
              />

              <GeneralButton
                type="button"
                text="cancel"
                warning
                onClick={() => setShowProfileEditPage(false)}
                className="justify-center w-28"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
