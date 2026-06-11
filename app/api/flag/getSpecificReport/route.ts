/**
 * Fetch, update, or soft-delete the current user's report for a content id.
 * Notes: docs/notes/app/api/flag-routes.md
 */
import dbConnect from "@utils/db";
import Report from "@/models/Report";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import { NextResponse } from "next/server";

type ReportUpdateBody = {
  reportId: string;
  reportCategories: string[];
  comments?: string;
};

type ReportDeleteBody = {
  reportId: string;
};

export async function GET(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) return auth.response;

  await dbConnect.connect();

  const userId = auth.session.user.id;
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("contentId");
  const status = searchParams.get("status");

  try {
    const report = await leanWithStrings(
      Report.findOne(
        { contentId, reportedBy: userId, ...(status ? { status } : {}) },
        {
          reportCategories: 1,
          comments: 1,
          reportedBy: 1,
          contentCreatedBy: 1,
          _id: 1,
          status: 1,
        },
      ).sort({ createdAt: -1 }),
    );

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) return auth.response;

  await dbConnect.connect();

  const userId = auth.session.user.id;
  const { reportId, reportCategories, comments } =
    (await req.json()) as ReportUpdateBody;

  try {
    const existingReport = await Report.findById(reportId);

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (existingReport.reportedBy.toString() !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to update this report" },
        { status: 403 },
      );
    }

    existingReport.reportCategories = reportCategories;
    existingReport.comments = comments;

    const updatedReport = await existingReport.save();

    return NextResponse.json({
      message: "Report updated successfully",
      updatedReport,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) return auth.response;

  await dbConnect.connect();

  const userId = auth.session.user.id;
  const { reportId } = (await req.json()) as ReportDeleteBody;

  try {
    const reportToUpdate = await Report.findOneAndUpdate(
      { _id: reportId, reportedBy: userId },
      { status: "deleted", outcome: "deletedByUser" },
      { new: true },
    );

    if (!reportToUpdate) {
      return NextResponse.json(
        {
          error:
            "Report not found or you are not authorized to delete this document",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Report marked as deleted",
      report: reportToUpdate,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
