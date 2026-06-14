/**
 * Nav bell link with unread notification count badge.
 * Notes: docs/notes/app/notifications-page.md
 */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useNotifications } from "@/context/notificationsContext";
import "@fortawesome/fontawesome-svg-core/styles.css";
import IconBadge from "../shared/icons/IconWithCount";

export default function NotificationsButton() {
  const { notificationsTotal } = useNotifications();

  const [unreadCount, setUnreadCount] = useState(notificationsTotal);

  useEffect(() => {
    setUnreadCount(notificationsTotal);
  }, [notificationsTotal]);

  return (
    <Link
      href="/notifications"
      aria-label="Go to notifications"
      className="mr-2 py-[6px] px-[10px] rounded-full hover:bg-blue-500"
    >
      <IconBadge icon="faBell" count={unreadCount} />
    </Link>
  );
}
