/**
 * Icon with optional unread badge (bell, heart, thanks cat).
 */
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faHeart } from "@fortawesome/free-solid-svg-icons";
import type { SizeProp } from "@fortawesome/fontawesome-svg-core";
import Thanks from "@components/Shared/icons/svg/thanks";

export type IconBadgeName = "faBell" | "faHeart" | "thanks";

export type IconBadgeProps = {
  icon: IconBadgeName;
  count?: number;
  iconSize?: SizeProp;
  className?: string;
};

const iconMap = {
  faBell,
  faHeart,
} as const;

export default function IconBadge({
  icon,
  count = 0,
  iconSize = "lg",
  className = "",
}: IconBadgeProps) {
  //   let fill = count > 0 ? "rgb(255, 0, 0)" : "rgb(221 214 254)";
  //   let faColor = count > 0 ? "text-blue-300" : "text-subtleWhite";
  return (
    <section className={`relative inline-block ${className}`}>
      {icon === "thanks" ? (
        <div className="-ml-2">
          {/* just used for thanks notifications */}
          <Thanks fill="rgb(221 214 254)" />
        </div>
      ) : (
        <FontAwesomeIcon
          icon={iconMap[icon]}
          size={iconSize}
          className="text-subtleWhite"
        />
      )}

      {count > 0 && (
        <span
          className={`absolute  text-xs ${
            icon === "thanks" ? " -top-1 -right-1" : "-top-2 -right-3"
          } text-subtleWhite px-1 bg-blue-700 rounded-full`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </section>
  );
}
