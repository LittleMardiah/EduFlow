import { NextRequest, NextResponse } from "next/server";
import { submissionService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";
import { requireRole } from "@/src/middleware/rbac";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req) => {
  const roleCheck = await requireRole("student", "admin")(req);
  if (roleCheck) return roleCheck;

  const id = req.nextUrl.pathname.split("/").filter(Boolean)[3] as string;
  const submission = await submissionService.submitQuiz(id, req.user.userId);
  return NextResponse.json({ success: true, data: submission });
});