/**
 * Modal list of users someone follows (profile page).
 * Notes: docs/notes/components/showing-list-of-content/youtube-and-social-lists.md
 */
import XSvgIcon from "@components/ReusableSmallComponents/iconsOrSvgImages/XSvgIcon";
import FollowButton from "@components/ReusableSmallComponents/buttons/FollowButton";
import ProfileImage from "@components/ReusableSmallComponents/ProfileImage";
import GifHover from "@components/ReusableSmallComponents/GifHover";
import type { FollowingUser } from "@/utils/api/getUserFollowing";
import type { Session } from "next-auth";

export type UsersFollowingListProps = {
  setShowUsersListPage: (show: boolean) => void;
  userData: FollowingUser[];
  sessionFromServer: Session;
};

export default function UsersFollowingList({
  setShowUsersListPage,
  userData,
  sessionFromServer,
}: UsersFollowingListProps) {
  return (
    <>
      <div>
        <div
          className="relative z-30"
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
                    onClickAction={() => setShowUsersListPage(false)}
                  />

                  <div
                    className="mx-auto flex flex-col font-semibold text-secondary bg-violet-900
             
                 p-4 shadow-lg max-w-3xl"
                  >
                    <h1 className="text-white text-xl">Following </h1>
                  </div>

                  {userData[0] ? (
                    userData.map((person) => (
                      <a
                        key={person._id}
                        href={`${
                          process.env.NEXT_PUBLIC_BASE_FETCH_URL
                        }profile/${person.profileName?.toLowerCase() ?? ""}`}
                      >
                        <section
                          className="grid 
    grid-cols-4 gap-4 
    border-b-2 border-amber-300
    bg-secondary
            text-purple-200 p-2  
            
            
            items-center justify-items-center"
                        >
                          {/* ###### PROFILE IMAGE #### */}

                          <ProfileImage
                            divStyling="w-16"
                            profileImage={person.profileImage}
                            layout="responsive"
                            className="rounded-2xl h-16"
                            width={100}
                            height={100}
                          />

                          {/* ###### PROFILE name, profile and bio #### */}
                          <section>
                            <span className="block"> {person.name}</span>

                            <span className="block">@{person.profileName}</span>
                          </section>

                          <p>{person.bio}</p>
                          {/* makes it so you can't follow yourself */}
                          {!(person._id == sessionFromServer.user?.id) && (
                            <section>
                              <FollowButton
                                data={person}
                                session={sessionFromServer}
                                apiLink={undefined}
                                FollowIconStyling={undefined}
                                FollowTextStyling={undefined}
                              />
                            </section>
                          )}
                        </section>
                      </a>
                    ))
                  ) : (
                    <div className="bg-secondary items-center">
                      <p className="py-4">Currently not following anyone 😿</p>

                      <p> Lets find some friends! </p>

                      <GifHover
                        divStyling="w-60 mx-auto py-6"
                        className="rounded-full"
                        layout="responsive"
                        gifSrc="/kittentopuppy.webp"
                        stillImageSrc="/kittentopuppy.png"
                        alt="gif of a kitten climbing out of its cage into the excited puppies cage next to it"
                        width={300}
                        height={300}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
