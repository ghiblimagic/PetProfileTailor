"use client";

import { useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";

import PointSystemList from "@components/Ranking/PointSystemList";
import EditBioAndProfile from "@components/EditingData/EditBioAndProfile";

import ToggleOneContentPage from "./ShowingListOfContent/ToggleOneContentPage";

import GeneralButton from "./ReusableSmallComponents/buttons/GeneralButton";
import { useSession } from "next-auth/react";
import ProfileImage from "./ReusableSmallComponents/ProfileImage";

export default function Profile({
  userData,
  nameList,

  createdDescriptions,
}) {
  const { data: session } = useSession();

  let userName = "";
  let profileImage = "";
  let signedInUsersId = "";
  if (session?.user) {
    userName = session.user.name;
    profileImage = session.user.profileImage;
    signedInUsersId = session.user.id;
  }

  const [showProfileEditPage, setShowProfileEditPage] = useState(false);
  const [profileChanged, setProfileChange] = useState(false);
  const [location, setLocation] = useState(userData.location);
  const [bio, setBio] = useState(userData.bio);
  const [avatar, setAvatar] = useState(userData.profileImage);

  // const [showFollowersList, setShowFollowersListPage] = useState(false);

  // const [showFollowingList, setShowFollowingList] = useState(false);

  function updateSetShowProfileEditPage() {
    setShowProfileEditPage(!showProfileEditPage);
  }

  function updateSetProfileChange() {
    setProfileChange(!profileChanged);
  }

  // function showListOfFollowers() {
  //   setShowFollowersListPage(!showFollowersList);
  // }

  // function showfollowingListFunction() {
  //   setShowFollowingList(!showFollowingList);
  // }

  const contentList = [
    {
      text: "Names",
      className: "mb-2",
      value: "Added Names",
    },
    {
      text: "Descriptions",
      className: "mb-2",
      value: "Added Descriptions",
    },
  ];

  // for names
  //########### Section that allows the deleted content to be removed without having to refresh the page, react notices that a key has been removed from the content list and unmounts that content ###########

  return (
    <div>
      <div className="flex flex-col md:flex-row mt-6">
        {/* ############## BIO ############## */}
        <section className=" sm:w-80 text-subtleWhite ">
          <div className="px-2 ">
            <div
              className="relative flex flex-col min-w-0 break-words bg-violet-950 mb-6 shadow-xl rounded-lg mt-16
    shadow-slate-900/70"
            >
              <div className="px-0">
                <div className="flex flex-wrap justify-center">
                  <div className="w-full px-4 flex justify-center">
                    <div className="relative">
                      <ProfileImage
                        divStyling="min-h-20 max-w-20 mr-4 mt-3 min-w-10 max-h-12"
                        profileImage={avatar}
                        layout="responsive"
                        className="rounded-2xl"
                        width={100}
                        height={100}
                      />

                      {/* //   src={userData.profileImage}
                      //   alt=""
                      //   className="rounded-2xl align-middle -mt-16 h-24"
                      //  */}
                    </div>
                  </div>
                  <div className="w-full text-center mt-2">
                    <span className="text-xl font-bold leading-normal ">
                      {userData.name}
                    </span>
                    <span> @{userData.profileName} </span>

                    {/* <div className="flex justify-center py-4">
                      <div className="mr-4 text-center">
                        <span className="text-xl font-bold block tracking-wide">
                          {usersFollowing.length}
                        </span>
                        <button
                          className="text-sm"
                          onClick={() => showfollowingListFunction()}
                        >
                          Following
                        </button>
                      </div>

                      <div className="text-center">
                        <span className="text-xl font-bold block tracking-wide">
                          {userData?.followers?.length || "0"}
                        </span>
                        <button
                          className="text-sm"
                          onClick={() => showListOfFollowers()}
                        >
                          Followers
                        </button>
                      </div>
                    </div> */}
                  </div>
                </div>

                <div className="text-center">
                  {userName != "" && session.user.id == userData._id && (
                    <GeneralButton
                      subtle
                      type="button"
                      text="edit"
                      onClick={() => setShowProfileEditPage(true)}
                    />
                  )}

                  {location && (
                    <div className="text-sm leading-normal mt-4 mb-2 font-bold ">
                      <FontAwesomeIcon
                        icon={faLocationDot}
                        className="mr-2 text-lg "
                      />

                      <span className="mr-2 text-lg">{location}</span>
                    </div>
                  )}
                </div>

                <div className="py-2  text-center">
                  <div className="flex flex-wrap justify-center">
                    <div className="w-full px-4">
                      <span className="text-lg font-bold">About:</span>

                      <p className="leading-relaxed">
                        {bio || "No bio written yet"}
                      </p>
                    </div>
                  </div>
                </div>

                <section className="relative pb-6 bg-secondary my-3 pt-4">
                  <div className="container mx-auto px-2 pt-2">
                    <PointSystemList
                      namesAdds={nameList.length}
                      descriptionsAdds={createdDescriptions.length}
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>
          {/* ###########  FOOTER  ########### */}
        </section>

        {/* ######## USERS CONTRIBUTIONS SECTION ##########*/}

        <div className=" flex-1 grid grid-cols-1 gap-4 mr-2 h-fit text-white pt-4  rounded-2xl">
          <ToggleOneContentPage
            contentList={contentList}
            swrForThisUserID={userData._id || ""}
            defaultOpen="Added Names"
          />

          <section className="my-2">
            {showProfileEditPage && (
              <EditBioAndProfile
                userData={userData}
                sessionFromServer={session}
                setShowProfileEditPage={updateSetShowProfileEditPage}
                setProfileChange={updateSetProfileChange}
                setLocation={setLocation}
                location={location}
                setBio={setBio}
                bio={bio}
                avatar={avatar}
                setAvatar={setAvatar}
              />
            )}

            {/* {showFollowersList && (
              <UsersFollowersList
                userData={userData}
                sessionFromServer={session}
                setShowUsersListPage={showListOfFollowers}
              />
            )}

            {showFollowingList && (
              <UsersFollowingList
                userData={usersFollowing}
                sessionFromServer={session}
                setShowUsersListPage={showfollowingListFunction}
              />
            )} */}
          </section>
        </div>
      </div>

      <section></section>
    </div>
  );
}
