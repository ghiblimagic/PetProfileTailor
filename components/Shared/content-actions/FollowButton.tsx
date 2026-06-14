/**
 * Follow / unfollow toggle for profile social lists.
 * Notes: docs/notes/components/reusable-buttons.md
 */
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { toast } from "react-toastify";
import type { Session } from "next-auth";
import type { ChangeEvent } from "react";

export type FollowButtonUser = {
  _id: string;
  followers?: Array<{ _id: string } | string>;
};

export type FollowButtonProps = {
  data: FollowButtonUser;
  session: Session | null;
  apiLink?: string;
  FollowIconStyling?: string;
  FollowTextStyling?: string;
};

export default function FollowButton({
  data,
  session,
  FollowIconStyling,
  FollowTextStyling,
}: FollowButtonProps) {
  const [userFollowed, setUserFollowed] = useState(false);
  const userToFollowId = data._id;
  const userId = session?.user?.id ?? "";

  useEffect(() => {
    if (!data.followers) {
      setUserFollowed(false);
      return;
    }

    const searchingInFollowers = data.followers.find(
      (follower) =>
        (typeof follower === "object" ? follower._id : follower) == userId,
    );

    setUserFollowed(searchingInFollowers != undefined);
  }, [userId, data.followers]);

  const handleFollows = (_e: ChangeEvent<HTMLInputElement>) => {
    if (!session?.user?.id) {
      toast.error("Please sign in to follow users");
      return;
    }

    const currentUserId = session.user.id;

    const putFollows = async () => {
      try {
        await axios.put("/api/user/updatefollows/", {
          userToFollowId,
          userId: currentUserId,
          userFollowed,
        });

        setUserFollowed(!userFollowed);
      } catch (err) {
        console.log("something went wrong :(", err);
      }
    };
    void putFollows();
  };

  return (
    <>
      {data._id == userId && <span>its you </span>}
      {userFollowed ? (
        <label
          className="justify-self-end
             mr-2 mx-auto bg-red-500 hover:bg-red-400 border-b-4 border-red-700 
                      hover:border-yellow-500 text-center py-2 px-4 rounded-2xl"
        >
          <input
            style={{ display: "none" }}
            type="checkbox"
            checked={userFollowed}
            onChange={handleFollows}
          />
          <FontAwesomeIcon
            icon={faUserPlus}
            className={`mr-2${FollowIconStyling}`}
          />

          <span className={`${FollowTextStyling}`}>Unfollow</span>
        </label>
      ) : (
        <label
          className="justify-self-end
             mr-2 mx-auto bg-subtleBackground hover:bg-blue-500 border-b-4 border-subtleWhite text-subtleWhite
                      hover:border-blue-700 text-center py-2 px-4 rounded-2xl"
        >
          <input
            style={{ display: "none" }}
            type="checkbox"
            checked={userFollowed}
            onChange={handleFollows}
          />
          <FontAwesomeIcon
            icon={faUserPlus}
            className={`mr-2 ${FollowIconStyling}`}
          />

          <span className={`${FollowTextStyling}`}>Follow</span>
        </label>
      )}
    </>
  );
}
