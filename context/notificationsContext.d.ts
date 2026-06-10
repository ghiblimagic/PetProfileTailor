import type { ReactNode } from "react";
import type { NotificationModelType } from "@/hooks/useSwrSimple";

export type NotificationCounts = {
  names: number;
  descriptions: number;
  thanks: number;
};

export type NotificationsContextValue = {
  notifications: NotificationCounts;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationCounts>>;
  notificationsTotal: number;
  timeGrabbed: Date | null;
  resetNotificationType: (type: NotificationModelType) => void;
};

export function useNotifications(): NotificationsContextValue;

export function NotificationsProvider(props: {
  children: ReactNode;
}): JSX.Element;
