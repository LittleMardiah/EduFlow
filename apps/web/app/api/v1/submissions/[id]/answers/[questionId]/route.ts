import { NextRequest, NextResponse } from "next/server";
import { saveAnswerSchema } from "@eduflow/core";
import { submissionService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";
import { requireRole } from "@/src/middleware/rbac";
import { validateBody } from "@/src/middleware/validation";

export const dynamic = "force-dynamic";

export const PUT = withAuth(async (req) => {
  const roleCheck = await requireRole("student", "admin")(req);
  if (roleCheck) return roleCheck;

  const segments = req.nextUrl.pathname.split("/").filter(Boolean);
  const submissionId = segments[3] as string;
  const questionId = segments[5] as string;

  const body = await req.json().catch(() => ({}));
  const { data, error } = validateBody(saveAnswerSchema, body);
  if (error) return error;

  const input = data as { student_answer?: string | null; option_id?: string | null };
  const answer = await submissionService.autoSaveAnswer(
    submissionId,
    questionId,
    input.student_answer ?? null,
    input.option_id ?? null,
    req.user.userId
  );
  return NextResponse.json({ success: true, data: answer });
});