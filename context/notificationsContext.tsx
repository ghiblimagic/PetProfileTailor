/**
 * Unread notification counts + mark-read for nav badge and notifications UI.
 * Notes: docs/notes/app/notifications-page.md
 */
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useSession } from "next-auth/react";
import type { NotificationModelType } from "@/hooks/useSwrSimple";

export type NotificationCounts = {
  names: number;
  descriptions: number;
  thanks: number;
};

export type NotificationsContextValue = {
  notifications: NotificationCounts;
  setNotifications: Dispatch<SetStateAction<NotificationCounts>>;
  notificationsTotal: number;
  timeGrabbed: Date | null;
  resetNotificationType: (type: NotificationModelType) => void;
};

type UserNotificationsResponse = NotificationCounts & {
  error?: string;
};

const emptyCounts: NotificationCounts = {
  names: 0,
  descriptions: 0,
  thanks: 0,
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context)
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  return context;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [notifications, setNotifications] =
    useState<NotificationCounts>(emptyCounts);

  const [timeGrabbed, setTimeGrabbed] = useState<Date | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!userId) {
      // Clear notifications when logged out
      setNotifications(emptyCounts);
      setTimeGrabbed(null);
      return;
    }

    const controller = new AbortController();

    fetch("/api/user/notifications", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: UserNotificationsResponse) => {
        if (!controller.signal.aborted) {
          setNotifications({
            names: data.names || 0,
            descriptions: data.descriptions || 0,
            thanks: data.thanks || 0,
          });
          setTimeGrabbed(new Date());
        }
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name !== "AbortError") {
          console.error(err);
        }
      });

    return () => controller.abort();
  }, [userId, status]);

  const notificationsTotal =
    notifications.names + notifications.descriptions + notifications.thanks;

  const resetNotificationType = (type: NotificationModelType) => {
    const urlMap: Record<NotificationModelType, string> = {
      thanks: "/api/notifications/thanks/mark-read",
      descriptions: "/api/notifications/descriptions/mark-read",
      names: "/api/notifications/names/mark-read",
    };

    fetch(urlMap[type], { method: "PATCH" }).catch((err) =>
      console.error("Failed to mark notifications as read:", err),
    );

    setNotifications((prev) => ({
      ...prev,
      [type]: 0,
    }));
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        setNotifications,
        notificationsTotal,
        timeGrabbed,
        resetNotificationType,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
