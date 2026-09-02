import { NextRequest, NextResponse } from "next/server";
import { submissionService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";
import { requireRole } from "@/src/middleware/rbac";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req) => {
  const roleCheck = await requireRole("student", "instructor", "admin")(req);
  if (roleCheck) return roleCheck;

  const segments = req.nextUrl.pathname.split("/").filter(Boolean);
  const quizId = segments[3] as string;

  const limit = req.nextUrl.searchParams.get("limit")
    ? parseInt(req.nextUrl.searchParams.get("limit")!, 10)
    : 20;
  const offset = req.nextUrl.searchParams.get("offset")
    ? parseInt(req.nextUrl.searchParams.get("offset")!, 10)
    : 0;

  let studentId = req.user.userId;
  if (req.user.role === "instructor" || req.user.role === "admin") {
    studentId = req.nextUrl.searchParams.get("student_id") || req.user.userId;
  }

  const submissions = await submissionService.listStudentSubmissions(
    quizId,
    studentId,
    limit,
    offset
  );
  return NextResponse.json({ success: true, data: submissions });
});