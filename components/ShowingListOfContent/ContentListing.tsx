/**
 * Single name/description row on listing pages (SWR list or standalone page).
 * Notes: docs/notes/components/content-listing.md
 */
"use client";

import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import LikesButtonAndLikesLogic from "@components/shared/content-actions/LikesButtonAndLikesLogic";
import DeleteButton from "@components/DeletingData/DeleteButton";
import EditButton from "@components/shared/actions/EditButton";
import EditContent from "../EditingData/EditContent";
import ShareButton from "@components/shared/content-actions/ShareButton";
import SharingOptionsBar from "../shared/content-actions/SharingOptionsBar";
import ProfileImage from "@components/shared/media/ProfileImage";
import ToggeableAlert from "../shared/feedback/ToggeableAlert";
import addHashToArrayString from "@utils/stringManipulation/addHashToArrayString";
import { Ellipsis } from "lucide-react";
import { useDeleteConfirmation } from "@hooks/useDeleteConfirmation";
import DeleteDialog from "@components/DeletingData/DeleteDialog";
import FlagDialog from "@components/Flagging/FlagDialog";
import FlagButton from "@components/Flagging/FlagButton";
import { useFlagging } from "@hooks/useFlagging";
import { useSuggest } from "@/hooks/useSuggest";
import { useEditHandler } from "@hooks/useEditHandler";
import { useReports } from "@context/ReportsContext";
import { useSuggestions } from "@/context/SuggestionsContext";
import { useSession } from "next-auth/react";
import SuggestButton from "../Suggestions/SuggestionButton";
import SuggestionDialog from "../Suggestions/SuggestionDialog";
import ThanksButton from "@/components/Thanks/ThanksButton";
import { useThanksHandler } from "@/hooks/useThanksHandler";
import ThanksDialog from "../Thanks/ThanksDialog";
import type { LikeableContent } from "@hooks/useLikeState";
import type { EditableContent } from "../EditingData/EditContent";
import type { ContentType } from "@/utils/api/checkIfValidContentType";
import type { LikeContentType } from "@/context/LikesContext";

export type ContentListingItem = LikeableContent & EditableContent;

type SwrPage = { data: ContentListingItem[]; totalDocs?: number };

export type ContentListingProps = {
  dataType: ContentType | string;
  singleContent: ContentListingItem;
  mutate?: (
    updater?: (pages?: SwrPage[]) => SwrPage[],
    shouldRevalidate?: boolean,
  ) => void;
  mode?: "swr" | "standalone";
  className?: string;
  /** Accepted from callers; session user id is read from `useSession`. */
  signedInUsersId?: string;
};

export default function ContentListing({
  dataType,
  singleContent,
  mutate,
  mode = "swr",
  className,
}: ContentListingProps) {
  const { data: session } = useSession();
  const { role, status, id: signedInUsersId } = session?.user ?? {};

  const {
    showDeleteConfirmation,
    deleteTarget,
    openDelete,
    closeDelete,
    confirmDelete,
  } = useDeleteConfirmation();

  const { getStatus } = useReports();
  const { getSuggestionStatus } = useSuggestions();
  const [localContent, setLocalContent] =
    useState<ContentListingItem>(singleContent);

  const content = mode === "standalone" ? localContent : singleContent;

  const reportStatus = getStatus(dataType, singleContent._id.toString());
  const reportPendingOrNone =
    reportStatus === "pending" || reportStatus === null;

  const suggestionStatus = getSuggestionStatus(
    dataType,
    singleContent._id.toString(),
  );
  const suggestionPendingOrNone =
    suggestionStatus === "pending" || suggestionStatus === null;

  const apiEndPoint =
    dataType === "names" ? "/api/names/" : "/api/description/";

  const apiBaseLink =
    dataType === "names" ? `/api/names/likes` : `/api/description/likes`;

  const linkToShare =
    dataType === "names"
      ? `${process.env.NEXT_PUBLIC_BASE_FETCH_URL}/name/${content.content}`
      : `${process.env.NEXT_PUBLIC_BASE_FETCH_URL}/description/${singleContent._id}`;

  const localLink =
    dataType === "names"
      ? `/name/${content.content}`
      : `/description/${singleContent._id}`;

  const { showFlagDialog, flagTarget, openFlag, closeFlag } = useFlagging();
  const {
    showSuggestionDialog,
    suggestionTarget,
    openSuggestion,
    closeSuggestion,
  } = useSuggest();

  const {
    showEditDialog,
    openEdit,
    closeEdit,
    confirmEdit,
  } = useEditHandler<ContentListingItem>({
    apiEndpoint: apiEndPoint,
    mutate,
    setLocalData: setLocalContent,
  });

  const { showThanksDialog, openThanks, closeThanks } = useThanksHandler({
    apiEndpoint: "api/thanks",
  });

  const userIsTheCreator = singleContent.createdBy._id === signedInUsersId;

  const contentProfileImage = userIsTheCreator
    ? session?.user?.profileImage
    : singleContent.createdBy.profileImage;

  const [showLikesSignInMessage, setShowLikesSignInMessage] = useState<
    string | boolean
  >(false);
  const [shareSectionShowing, setShareSectionShowing] = useState(false);
  const [ideaFormToggled, setIdeaFormToggled] = useState(false);

  // TODO: wire idea submission state (was referenced in jsx but never defined)
  const userAlreadySentIdea = false;

  function onClickShowShares() {
    setShareSectionShowing(!shareSectionShowing);
  }

  const href = `${process.env.NEXT_PUBLIC_BASE_FETCH_URL}profile/${singleContent.createdBy.profileName?.toLowerCase() ?? ""}`;

  const likeDataType = dataType as LikeContentType;

  return (
    <div
      className={`text-base flex border-t border-subtleWhite mb-4 ${className ?? ""}   bg-primary`}
    >
      <ProfileImage
        divStyling="min-h-10 max-w-12 mr-4 mt-3 min-w-10 max-h-12"
        profileImage={contentProfileImage}
        layout="responsive"
        className="rounded-2xl"
        width={80}
        height={80}
        href={href}
      />
      <div className="flex-grow ">
        <div className="grid  grid-cols-1 space-between flex-none text-subtleWhite sm:p-2 justify-items-center ">
          <section className="w-full pt-2 text-left">
            <div className="">
              <div className="w-full p-2 flex items-start">
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_FETCH_URL}profile/${singleContent.createdBy.profileName?.toLowerCase() ?? ""}`}
                  className="flex-1 min-w-0 flex flex-col"
                >
                  <span className="font-bold text-lg break-words">
                    {singleContent.createdBy.name}
                  </span>
                  <span className="font-thin text-base text-gray-300 break-words">
                    @{singleContent.createdBy.profileName}
                  </span>
                </a>

                <Menu
                  as="div"
                  className="relative inline-block text-left ml-2"
                >
                  {({ open }) => (
                    <>
                      <div>
                        <MenuButton
                          className={`px-2 py-1 rounded ${
                            open
                              ? " bg-subtleWhite text-secondary rounded-2xl"
                              : "hover:bg-blue-500 rounded-2xl"
                          }`}
                        >
                          <Ellipsis
                            aria-hidden="true"
                            focusable="false"
                          />
                          <span className="sr-only">More options</span>
                        </MenuButton>
                      </div>

                      {(signedInUsersId &&
                        singleContent.createdBy._id == signedInUsersId) ||
                      (role === "admin" && status === "active") ? (
                        <MenuItems className="absolute right-0 mt-2 w-48 py-3 origin-top-right bg-secondary border text-subtleWhite border-subtleWhite rounded-md shadow-lg focus:outline-none z-50 space-y-2">
                          <MenuItem as="div">
                            {({ focus }) => (
                              <DeleteButton
                                content={singleContent}
                                onDeleteClick={(item, e) => {
                                  e.stopPropagation();
                                  openDelete(item);
                                }}
                                className={`ml-2 mr-6 rounded-sm w-[90%] group flex items-center ${
                                  focus ? "bg-blue-500 text-white" : ""
                                }`}
                              />
                            )}
                          </MenuItem>
                          <MenuItem as="div">
                            {({ focus }) => (
                              <EditButton
                                content={singleContent}
                                onupdateEditState={(item, e) => {
                                  e.stopPropagation();
                                  if (item) openEdit(singleContent);
                                }}
                                className={`ml-2 mr-6 w-[90%] rounded-sm group flex items-center ${
                                  focus ? "bg-blue-500 text-white" : ""
                                }`}
                              />
                            )}
                          </MenuItem>
                        </MenuItems>
                      ) : (
                        <MenuItems className="absolute right-0 mt-2 w-48 py-3 origin-top-right bg-secondary border text-subtleWhite border-subtleWhite rounded-md shadow-lg focus:outline-none z-50">
                          <MenuItem>
                            {() => (
                              <FlagButton
                                content={singleContent}
                                dataType={dataType}
                                onClick={openFlag}
                                userIsTheCreator={
                                  singleContent.createdBy._id ===
                                  signedInUsersId
                                }
                              />
                            )}
                          </MenuItem>

                          <MenuItem as="div">
                            {() => (
                              <SuggestButton
                                content={singleContent}
                                dataType={dataType}
                                onClick={openSuggestion}
                              />
                            )}
                          </MenuItem>
                        </MenuItems>
                      )}
                    </>
                  )}
                </Menu>
              </div>
            </div>

            {showDeleteConfirmation && deleteTarget && (
              <DeleteDialog
                open={showDeleteConfirmation}
                target={deleteTarget}
                onClose={closeDelete}
                signedInUsersId={signedInUsersId}
                onConfirm={() =>
                  confirmDelete(
                    apiEndPoint,
                    signedInUsersId ?? "",
                    mode === "swr" ? mutate : undefined,
                    mode === "standalone" ? setLocalContent : undefined,
                  )
                }
              />
            )}

            {!userIsTheCreator && reportPendingOrNone && showFlagDialog && (
              <FlagDialog
                dataType={dataType}
                open={showFlagDialog}
                target={flagTarget}
                onClose={closeFlag}
                signedInUsersId={signedInUsersId}
                contentId={singleContent._id}
              />
            )}

            {!userIsTheCreator &&
              suggestionPendingOrNone &&
              showSuggestionDialog && (
                <SuggestionDialog
                  dataType={dataType}
                  open={showSuggestionDialog}
                  target={suggestionTarget}
                  onClose={closeSuggestion}
                  signedInUsersId={signedInUsersId}
                  contentId={singleContent._id}
                />
              )}

            {!userIsTheCreator && showThanksDialog && (
              <ThanksDialog
                dataType={dataType}
                open={showThanksDialog}
                contentInfo={content}
                onClose={closeThanks}
                signedInUsersId={signedInUsersId}
              />
            )}

            {showEditDialog && (
              <EditContent
                dataType={dataType}
                open={showEditDialog}
                onClose={closeEdit}
                content={localContent}
                onSave={confirmEdit}
              />
            )}
          </section>

          <span
            className={`font-bold  text-center block w-full mb-2 ${
              dataType === "names" ? "text-xl" : "text-base"
            }`}
          >
            {content.content}{" "}
          </span>

          <p className="whitespace-pre-line">{content.notes}</p>

          <span className="my-4"> {addHashToArrayString(singleContent)} </span>

          <div className="w-full flex justify-evenly m-2 ">
            <LikesButtonAndLikesLogic
              dataType={likeDataType}
              data={singleContent}
              setShowLikesSignInMessage={(message) =>
                setShowLikesSignInMessage(message)
              }
              HeartIconStyling="text-xl ml-2 my-auto mx-auto"
              HeartIconTextStyling="mx-2"
              signedInUsersId={signedInUsersId ?? ""}
              apiBaseLink={apiBaseLink}
            />

            <ShareButton onClickShowShares={onClickShowShares} />

            {singleContent.createdBy._id !== signedInUsersId && (
              <ThanksButton onClick={() => openThanks(singleContent._id)} />
            )}
          </div>
        </div>

        {shareSectionShowing && (
          <section className="bg-primary py-2">
            <SharingOptionsBar
              linkToShare={linkToShare}
              localLink={localLink}
            />
          </section>
        )}

        {showLikesSignInMessage && (
          <ToggeableAlert<string | boolean>
            text="You must be signed in to like content"
            setToggleState={setShowLikesSignInMessage}
            toggleState={showLikesSignInMessage}
          />
        )}

        {ideaFormToggled && userIsTheCreator && (
          <ToggeableAlert<boolean>
            text="You cannot flag your own content 😜"
            setToggleState={setIdeaFormToggled}
            toggleState={ideaFormToggled}
          />
        )}

        {ideaFormToggled && userAlreadySentIdea && (
          <ToggeableAlert<boolean>
            text="We are in the process of reviewing your idea. Please wait for the prior report to be reviewed before submitting"
            setToggleState={setIdeaFormToggled}
            toggleState={ideaFormToggled}
          />
        )}
      </div>
    </div>
  );
}
