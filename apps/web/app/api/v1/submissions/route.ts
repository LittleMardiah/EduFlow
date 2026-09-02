import { NextRequest, NextResponse } from "next/server";
import { createSubmissionSchema } from "@eduflow/core";
import { submissionService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";
import { requireRole } from "@/src/middleware/rbac";
import { validateBody } from "@/src/middleware/validation";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req) => {
  const roleCheck = await requireRole("student", "admin")(req);
  if (roleCheck) return roleCheck;

  const body = await req.json().catch(() => ({}));
  const { data, error } = validateBody(createSubmissionSchema, body);
  if (error) return error;

  const input = data as { quiz_id: string; event_id?: string };
  const submission = await submissionService.createSubmission(input.quiz_id, req.user.userId, input.event_id);
  return NextResponse.json({ success: true, data: submission }, { status: 201 });
});