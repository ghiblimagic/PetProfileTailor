"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";

export type ProfileImageProps = {
  profileImage?: string;
  className?: string;
  /** Legacy prop — kept for callers; not used in this component. */
  layout?: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  divStyling?: string;
  href?: string;
  onClick?: (e: MouseEvent) => void;
};

export default function ProfileImage({
  profileImage,
  className,
  width = "200",
  height = "200",
  divStyling,
  href,
  onClick,
}: ProfileImageProps) {
  const [hover, setHover] = useState(false);
  const handleMouseEnter = () => setHover(true);
  const handleMouseLeave = () => setHover(false);

  const profileImageString = profileImage ?? "";
  const hoverProfileImage = hover
    ? profileImageString
    : profileImageString.replace(".gif", ".jpg");

  const imageElement = (
    <Image
      src={hoverProfileImage?.trimEnd()}
      alt="Profile image"
      className={className}
      width={width}
      height={height}
      unoptimized
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        maxWidth: "100%",
        width: "auto",
        height: "auto",
        cursor: href || onClick ? "pointer" : "default",
      }}
      onClick={!href ? onClick : undefined} // ignore onClick if href prop exists
    />
  );

  return (
    <div className={divStyling}>
      {href ? (
        //  If href provided, use Next.js Link
        // for contentListing
        <Link href={href} className="inline-block">
          {imageElement}
        </Link>
      ) : (
        //  Otherwise, just render the image
        // notifications area, where we can't make it a Link because the entire content is a clickable Link too, aka manually routing to profile page
        imageElement
      )}
    </div>
  );
}
