import { NextResponse } from "next/server";
import { createQuestionSchema } from "@eduflow/core";
import { createQuestion, listQuestionsByQuiz, type CreateQuestionInput } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";
import { requireRole } from "@/src/middleware/rbac";
import { validateBody } from "@/src/middleware/validation";

export const dynamic = "force-dynamic";

function getQuizId(req: { nextUrl: { pathname: string } }): string {
  const segments = req.nextUrl.pathname.split("/");
  return segments[segments.length - 2] as string;
}

export const GET = withAuth(async (req) => {
  const roleCheck = await requireRole("instructor", "admin")(req);
  if (roleCheck) return roleCheck;

  const quizId = getQuizId(req);
  const questions = await listQuestionsByQuiz(quizId);
  return NextResponse.json({ success: true, data: questions });
});

export const POST = withAuth(async (req) => {
  const roleCheck = await requireRole("instructor", "admin")(req);
  if (roleCheck) return roleCheck;

  const quizId = getQuizId(req);
  const body = await req.json().catch(() => ({}));
  const { data, error } = validateBody(createQuestionSchema, body);
  if (error) return error;

  try {
    const input = { quiz_id: quizId, ...data } as CreateQuestionInput;
    const question = await createQuestion(input, req.user.userId);
    return NextResponse.json({ success: true, data: question }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create question";
    const status = message === "Not authorized" ? 403 : 400;
    return NextResponse.json({ success: false, error: { message } }, { status });
  }
});