import { NextRequest, NextResponse } from "next/server";
import { submissionService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").filter(Boolean)[3] as string;
  const submission = await submissionService.getSubmission(id, req.user.userId, req.user.role);
  return NextResponse.json({ success: true, data: submission });
});