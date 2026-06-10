/**
 * Client shell for NotificationsProvider (used from server layout).
 * Notes: docs/notes/app/notifications-page.md
 */
"use client";

import type { ReactNode } from "react";
import { NotificationsProvider } from "@/context/notificationsContext";

type NotificationsWrapperProps = {
  children: ReactNode;
};

export default function NotificationsWrapper({
  children,
}: NotificationsWrapperProps) {
  return <NotificationsProvider>{children}</NotificationsProvider>;
}
