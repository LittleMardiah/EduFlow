import { NextRequest, NextResponse } from "next/server";
import { createQuizSchema } from "@eduflow/core";
import { createQuiz, listQuizzes, type CreateQuizInput } from "@eduflow/services";
import { getUserById } from "@eduflow/repositories";
import { withAuth } from "@/src/middleware/auth";
import { requireRole } from "@/src/middleware/rbac";
import { validateBody } from "@/src/middleware/validation";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req) => {
  const roleCheck = await requireRole("student", "instructor", "admin")(req);
  if (roleCheck) return roleCheck;

  const { searchParams } = req.nextUrl;
  const filters = {
    status: searchParams.get("status") || undefined,
    instructorId: searchParams.get("instructor_id") || undefined,
    organizationId: searchParams.get("organization_id") || undefined,
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
  };

  const data = await listQuizzes(filters, req.user.userId, req.user.role);
  return NextResponse.json({ success: true, data });
});

export const POST = withAuth(async (req) => {
  const roleCheck = await requireRole("instructor", "admin")(req);
  if (roleCheck) return roleCheck;

  const body = await req.json().catch(() => ({}));
  const { data, error } = validateBody(createQuizSchema, body);
  if (error) return error;

  const input = data as CreateQuizInput;
  const user = await getUserById(req.user.userId);
  const quiz = await createQuiz(input, req.user.userId, user?.organization_id || "org-placeholder");
  return NextResponse.json({ success: true, data: quiz }, { status: 201 });
});