/**
 * Submit a new content report (flag).
 * Notes: docs/notes/app/api/flag-routes.md
 */
import dbConnect from "@utils/db";
import Report from "@models/Report";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import { NextResponse } from "next/server";
import type { ReportContentType } from "@/models/Report";

type FlagReportBody = {
  contentType: ReportContentType | string;
  contentId: string;
  contentCopy: Record<string, unknown>;
  contentCreatedBy: string;
  reportCategories: string[];
  comments?: string;
};

export async function POST(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) return auth.response;

  await dbConnect.connect();

  const reportedByUserId = auth.session.user.id;
  const {
    contentType,
    contentId,
    contentCopy,
    contentCreatedBy,
    reportCategories,
    comments,
  } = (await req.json()) as FlagReportBody;

  if (contentCreatedBy === reportedByUserId) {
    return NextResponse.json(
      {
        report: {
          contentType,
          contentId,
          contentCopy,
          reportCategories,
          comments,
        },
        message: "You cannot flag your own content",
      },
      { status: 400 },
    );
  }

  const existingReport = await Report.findOne({
    reportedBy: reportedByUserId,
    contentId,
    status: { $nin: ["dismissed", "deleted", "resolved"] },
  });

  if (existingReport) {
    return NextResponse.json(
      {
        report: existingReport,
        message:
          "You cannot flag this content again until the review process is completed for your current report",
      },
      { status: 400 },
    );
  }

  try {
    const report = await Report.create({
      contentType,
      contentId,
      contentCopy,
      contentCreatedBy,
      reportedBy: reportedByUserId,
      reportCategories,
      comments,
    });

    return NextResponse.json(
      { report, message: "Report successfully submitted, thank you!" },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Report not submitted. There was an error!" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Not Found" }, { status: 404 });
}

export async function PUT() {
  return NextResponse.json({ message: "Not Found" }, { status: 404 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Not Found" }, { status: 404 });
}
