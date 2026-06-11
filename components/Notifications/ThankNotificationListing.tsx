/**
 * Single row for thank notifications.
 * Notes: docs/notes/app/notifications-page.md
 */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { formatDistanceStrict } from "date-fns";
import Link from "next/link";
import ProfileImage from "../ReusableSmallComponents/ProfileImage";
import Thanks from "@components/ReusableSmallComponents/iconsOrSvgImages/svgImages/thanks";
import { useRouter } from "next/navigation";
import type { NotificationListingProps } from "./NotifListingWrapper";

export type ThankNotificationUser = {
  _id?: string;
  profileName?: string;
  profileImage?: string;
  name?: string;
};

export type ThankNotificationNameRef = {
  _id?: string;
  content?: string;
  createdBy?: string;
  tags?: string[];
};

export type ThankNotificationDescriptionRef = {
  _id?: string;
  content?: string;
  createdBy?: string;
};

/** Populated shape from `/api/notifications/thanks`. */
export type ThankNotification = {
  _id: string;
  thanksBy?: ThankNotificationUser;
  contentType?: "names" | "descriptions" | string;
  nameId?: ThankNotificationNameRef | null;
  descriptionId?: ThankNotificationDescriptionRef | null;
  messages?: string[];
  read?: boolean;
  createdAt?: string | Date;
};

export type ThanksContentListingProps = NotificationListingProps & {
  singleContent: ThankNotification;
};

export default function ThanksContentListing({
  singleContent,
}: ThanksContentListingProps) {
  const {
    thanksBy,
    contentType,
    nameId,
    descriptionId,
    messages = [],
    createdAt,
    read,
  } = singleContent;

  const [isSeen, setIsSeen] = useState(Boolean(read)); // start from DB value
  const ref = useRef<HTMLDivElement>(null);

  const router = useRouter();
  // useRouter since a Link cannot be inside a Link, because a's cannot be nested
  // so instead we manually deal with that inner routing with useRouter

  useEffect(() => {
    if (isSeen) return; // already seen, no need to observe

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // avoid instant fade for fast scrolling
            //  delay so it doesn’t mark seen instantly
            setTimeout(() => setIsSeen(true), 1200);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: [0.5] },
    );

    const node = ref.current;
    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [isSeen]);

  // Optionally, trigger a backend PATCH when seen
  //   useEffect(() => {
  //     if (isSeen && !read) {
  //       fetch(`/api/notifications/${singleContent._id}`, {
  //         method: "PATCH",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ read: true }),
  //       }).catch(() => {}); // fail silently
  //     }
  //   }, [isSeen, read, singleContent._id]);

  const profileLink = `${
    process.env.NEXT_PUBLIC_BASE_FETCH_URL
  }profile/${thanksBy?.profileName?.toLowerCase() ?? ""}`;
  const contentLink =
    contentType === "names"
      ? `/name/${nameId?.content}`
      : `/description/${descriptionId?._id}`;

  const currentDate = new Date();

  const descriptionContent = descriptionId?.content
    ? descriptionId.content.slice(0, 60) +
      (descriptionId.content.length > 60 ? "..." : "")
    : "";

  return (
    <div
      ref={ref}
      className={`transition-colors duration-700 rounded-2xl px-2 text-subtleWhite ml-5 flex my-2 ${
        isSeen ? "bg-transparent" : "bg-secondary/40"
      } hover:bg-secondary/60`}
    >
      <span className="mr-4 mt-3">
        <Thanks fill="#FF0000" />
      </span>

      <section>
        <Link href={contentLink}>
          <ProfileImage
            divStyling="h-8 w-8 mr-4 mt-3 mb-2"
            profileImage={thanksBy?.profileImage}
            layout="responsive"
            className="rounded-2xl"
            width="40"
            height="40"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault(); // prevent outer link trigger
              e.stopPropagation();
              router.push(profileLink);
            }}
          />

          <p className="flex">
            <span
              className="font-bold font-white break-words mr-1 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(profileLink);
              }}
            >
              {thanksBy?.name}
            </span>

            {createdAt &&
              `thanked you • ${formatDistanceStrict(
                new Date(createdAt),
                currentDate,
              )} ago`}
          </p>

          <ul className="my-2">
            {messages.map((message) => (
              <li key={message}>{`• ${message}`}</li>
            ))}
          </ul>

          <p>
            {contentType === "names" ? nameId?.content : descriptionContent}
          </p>
        </Link>
      </section>
    </div>
  );
}
