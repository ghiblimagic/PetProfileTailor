/**
 * Client cache of the user's pending reports by content id.
 * Notes: docs/notes/models/moderation-and-thanks.md
 */
"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
  type MutableRefObject,
} from "react";
import { useSession } from "next-auth/react";
import type { UserReportsResponse } from "@/app/api/user/reports/route";

export type ReportBucketType = "names" | "descriptions" | "users";

type ReportMapEntry = {
  reportId?: string;
  status: string;
};

type ReportsRefData = Record<ReportBucketType, Map<string, ReportMapEntry>>;

export type ReportsContextValue = {
  reportsRef: MutableRefObject<ReportsRefData>;
  hasReported: (type: ReportBucketType | string, contentId: string) => boolean;
  getStatus: (type: ReportBucketType | string, contentId: string) => string | null;
  addReport: (
    type: ReportBucketType | string,
    contentId: string,
    reportId: string,
    status?: string,
  ) => void;
  deleteReport: (
    type: ReportBucketType | string,
    contentId: string,
    reportId: string,
  ) => void;
};

const emptyReportsRef = (): ReportsRefData => ({
  names: new Map(),
  descriptions: new Map(),
  users: new Map(),
});

const ReportsContext = createContext<ReportsContextValue | null>(null);

export function useReports(): ReportsContextValue {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error("useReports must be used within a ReportsProvider");
  }
  return context;
}

export function ReportsProvider({
  children,
}: {
  children: ReactNode;
  /** Reserved — not used yet. */
  initialReports?: Record<string, unknown>;
}) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const reportsRef = useRef<ReportsRefData>(emptyReportsRef());

  useEffect(() => {
    if (status === "loading") return;

    if (!userId) {
      reportsRef.current.names.clear();
      reportsRef.current.descriptions.clear();
      reportsRef.current.users.clear();
      return;
    }

    const controller = new AbortController();

    fetch("/api/user/reports", { cache: "no-store", signal: controller.signal })
      .then((res) => res.json())
      .then((data: UserReportsResponse) => {
        if (!controller.signal.aborted) {
          const { names = [], descriptions = [], users = [] } = data;

          reportsRef.current.names = new Map(
            names.map((r) => [
              r.contentId.toString(),
              { reportId: r._id?.toString?.(), status: r.status || "pending" },
            ]),
          );

          reportsRef.current.descriptions = new Map(
            descriptions.map((r) => [
              r.contentId.toString(),
              { reportId: r._id?.toString?.(), status: r.status || "pending" },
            ]),
          );

          reportsRef.current.users = new Map(
            users.map((r) => [
              r.contentId.toString(),
              { reportId: r._id?.toString?.(), status: r.status || "pending" },
            ]),
          );
        }
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") console.error(err);
      });

    return () => controller.abort();
  }, [userId, status]);

  const hasReported = (type: ReportBucketType | string, contentId: string) => {
    const map = reportsRef.current[type as ReportBucketType];
    if (!map) return false;
    return map.has(contentId.toString());
  };

  const getStatus = (type: ReportBucketType | string, contentId: string) => {
    const map = reportsRef.current[type as ReportBucketType];
    if (!map) return null;
    return map.get(contentId.toString())?.status ?? null;
  };

  const addReport = (
    type: ReportBucketType | string,
    contentId: string,
    reportId: string,
    reportStatus = "pending",
  ) => {
    const map = reportsRef.current[type as ReportBucketType];
    if (!map) return;
    map.set(contentId.toString(), { reportId, status: reportStatus });
  };

  const deleteReport = (
    type: ReportBucketType | string,
    contentId: string,
    reportId: string,
  ) => {
    const map = reportsRef.current[type as ReportBucketType];
    if (!map) return;

    const value = map.get(contentId.toString());
    if (value && value.reportId === reportId) {
      map.delete(contentId.toString());
    }
  };

  return (
    <ReportsContext.Provider
      value={{ reportsRef, hasReported, getStatus, addReport, deleteReport }}
    >
      {children}
    </ReportsContext.Provider>
  );
}
