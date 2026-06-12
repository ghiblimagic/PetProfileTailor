/**
 * Client shell for AdminProvider (used from `app/(admin)/layout`).
 * Notes: docs/notes/context/admin-context.md
 */
"use client";

import type { ReactNode } from "react";
import { AdminProvider } from "@/context/AdminContext";

export type AdminWrapperProps = {
  children: ReactNode;
  isAdmin: boolean;
};

export default function AdminWrapper({
  children,
  isAdmin,
}: AdminWrapperProps) {
  return (
    <AdminProvider isAdminServer={isAdmin}>{children}</AdminProvider>
  );
}
