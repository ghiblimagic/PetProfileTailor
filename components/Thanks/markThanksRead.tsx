"use client";

import { useEffect } from "react";

/** Marks all thank notifications read on mount. Currently unused on notifications page. */
export default function MarkThanksRead() {
  useEffect(() => {
    fetch("/api/notifications/thanks/mark-read", { method: "PATCH" }).catch(
      (err) => console.error("Failed to mark notifications as read:", err),
    );
  }, []);

  return null;
}
