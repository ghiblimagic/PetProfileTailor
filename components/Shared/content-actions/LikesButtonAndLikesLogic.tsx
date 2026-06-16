/**
 * Heart button + like count; wires useLikeState and sign-in gate.
 * Notes: docs/notes/app/api/togglelike-route.md
 */
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-toastify/dist/ReactToastify.css";
import {
  useLikeState,
  type LikeableContent,
} from "@hooks/useLikeState";
import type { LikeContentType } from "@/context/LikesContext";
import ContainerForLikeShareFlag from "./ContainerForLikeShareFlag";
import { useSession } from "next-auth/react";

export type LikesButtonAndLikesLogicProps = {
  data: LikeableContent;
  signedInUsersId: string;
  apiBaseLink: string;
  HeartIconStyling: string;
  HeartIconTextStyling: string;
  setShowLikesSignInMessage: (message: string) => void;
  dataType: LikeContentType;
};

export default function LikesButtonAndLikesLogic({
  data,
  signedInUsersId,
  apiBaseLink,
  HeartIconStyling,
  HeartIconTextStyling,
  setShowLikesSignInMessage,
  dataType,
}: LikesButtonAndLikesLogicProps) {
  const { data: session } = useSession();
  // console.log("session in likes button", session);

  // console.log("signedInUsersId in likes button", signedInUsersId);
  // console.log("datatype in likesbutton", dataType);
  const { liked, likeCount, isProcessing, isRateLimited, remainingSeconds, toggleLike } = useLikeState({
    data,
    dataType,
    userId: signedInUsersId,
    apiBaseLink,
  });

  const toggleLikeIfSignedIn = () => {
    if (!session) {
      setShowLikesSignInMessage("you must be signed in to like content");
      return;
    }

    toggleLike();
  };

  return (
    <ContainerForLikeShareFlag>
      <button
        className="w-full"
        disabled={isProcessing || isRateLimited}
        onClick={() => toggleLikeIfSignedIn()}
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
        aria-label={liked ? "Unlike" : "Like"}
      >
        <FontAwesomeIcon
          icon={faHeart}
          className={`${HeartIconStyling}`}
          color={liked ? "red" : "white"}
        />

        <span className={`${HeartIconTextStyling}`}>{likeCount}</span>
      </button>
      {remainingSeconds > 0 && (
        <p className="text-subtleWhite text-xs text-center leading-tight mt-0.5">
          Please wait {remainingSeconds} sec{remainingSeconds !== 1 ? "s" : ""}
        </p>
      )}
    </ContainerForLikeShareFlag>
  );
}
