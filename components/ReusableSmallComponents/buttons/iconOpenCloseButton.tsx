/**
 * Tab-style open/close button with icon badge (notifications tabs).
 * Notes: docs/notes/app/notifications-page.md
 */
"use client";

import IconBadge, { type IconBadgeName } from "../IconWithCount";

export type IconOpenCloseButtonProps<T extends string> = {
  state: T | null;
  text: string;
  value: T;
  className?: string;
  setState: (value: T) => void;
  icon: IconBadgeName;
  unreadCount?: number;
};

export default function IconOpenCloseButton<T extends string>({
  state,
  text,
  value,
  className,
  setState,
  icon,
  unreadCount,
}: IconOpenCloseButtonProps<T>) {
  return (
    <button
      className={`hover:rounded-2xl
    text-subtleWhite  font-bold py-2 px-4 
    hover:bg-blue-500
    hover:border-blue-600 text-base
    ${state === value && "border-b-4 border-subtleWhite"}
    ${className} `}
      onClick={() => setState(value)}
    >
      {/* bg-subtleBackground  border-b-4 border-subtleWhite  */}
      <div className="flex items-center">
        <p className="whitespace-normal break-words mr-2">{text}</p>

        <IconBadge icon={icon} count={unreadCount} />
      </div>
    </button>
  );
}
