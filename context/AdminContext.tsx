/**
 * Admin role gate for `(admin)` routes — syncs server session with client session.
 * Notes: docs/notes/context/admin-context.md
 */
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export type AdminContextValue = {
  isAdmin: boolean;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within AdminProvider");
  return context;
}

export type AdminProviderProps = {
  children: ReactNode;
  /** Initial value from server layout (`getServerSession`) */
  isAdminServer: boolean;
};

export function AdminProvider({ children, isAdminServer }: AdminProviderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(isAdminServer);

  useEffect(() => {
    if (status === "loading") return;

    const role = session?.user?.role;
    const isActive = session?.user?.status === "active";
    const nextIsAdmin = role === "admin" && isActive;

    if (status === "authenticated" && !nextIsAdmin) {
      router.push("/dashboard");
    }

    if (nextIsAdmin !== isAdmin) {
      setIsAdmin(nextIsAdmin); // update context value only if changed
    }
  }, [session, status, router, isAdmin]);

  return (
    <AdminContext.Provider value={{ isAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}
