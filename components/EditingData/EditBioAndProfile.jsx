"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import XSvgIcon from "@components/ReusableSmallComponents/iconsOrSvgImages/XSvgIcon";
import Image from "next/image";
import ImageUpload from "@components/AddingNewData/ImageUpload";
import GeneralButton from "../ReusableSmallComponents/buttons/GeneralButton";
import StyledInput from "../FormComponents/StyledInput";
import StyledTextarea from "../FormComponents/StyledTextarea";

export default function EditBioAndProfile({
  setShowProfileEditPage,
  userData,
  sessionFromServer,
  setProfileChange,
  setBio,
  bio,
  setLocation,
  location,
  avatar,
  setAvatar,
}) {
  const bioSubmission = async () => {
    const bioSubmission = {
      bio: bio,
      location: location,
      userid: sessionFromServer.user.id,
    };

    await axios
      .put("/api/user/editbiolocationavatar", {
        bioSubmission,
      })
      .then((response) => {
        //reloads page
        setProfileChange(true);
        setShowProfileEditPage(false);
        toast.success("Profile successfully updated!");
      })
      .catch((error) => {
        console.log("there was an error when sending your edits", error);

        toast.error(`Ruh Roh! Profile not updated`);
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
          {/* centers content */}
          <div
            className="            
            p-4 text-center sm:items-center sm:p-0 
            max-w-3xl
            mx-auto my-2"
          >
            <div>
              <div className="relative">
                {/* X Button and SVG Icon */}

                <XSvgIcon
                  screenReaderText="Close Edit Screen"
                  onClickAction={() => setShowProfileEditPage(false)}
                />

                <div
                  className="mx-auto flex flex-col font-semibold text-secondary bg-primary
                 border-2 border-violet-400 border-dotted 
                 p-4 shadow-lg max-w-3xl"
                >
                  {/* ##### NAME AREA ######*/}
                  <h4 className="text-subtleWhite mt-4"> location </h4>

                  <StyledInput
                    className="bg-secondary"
                    onChange={(e) => setLocation(e.target.value)}
                    value={location}
                    maxLength="70"
                    id="location"
                  />

                  <span className="text-subtleWhite">
                    {" "}
                    {`${70 - location.length}/70 characters left`}
                  </span>

                  {/* ##### DESCRIPTION AREA ######*/}

                  <h4 className="text-subtleWhite"> Bio </h4>

                  <StyledTextarea
                    onChange={(e) => setBio(e.target.value)}
                    required
                    maxLength="400"
                    value={bio}
                  />

                  <span className="text-subtleWhite">
                    {" "}
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
                    sessionFromServer={sessionFromServer}
                    setAvatar={setAvatar}
                    setShowDialog={setShowProfileEditPage}
                  />
                </div>
              </div>
            </div>

            {/* ###########                       buttons                     ############## */}
            <div
              className="bg-secondary px-4 py-3
                 sm:px-6 grid grid-cols-2 justify-items-center"
            >
              <GeneralButton
                type="button"
                text="save"
                subtle
                onClick={() => bioSubmission()}
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
