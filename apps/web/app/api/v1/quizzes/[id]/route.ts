import { NextResponse } from "next/server";
import { updateQuizSchema } from "@eduflow/core";
import { getQuizById, updateQuiz, softDeleteQuiz, type UpdateQuizInput } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";
import { validateBody } from "@/src/middleware/validation";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").pop() as string;
  const quiz = await getQuizById(id);
  if (!quiz) {
    return NextResponse.json({ success: false, error: { message: "Quiz not found" } }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: quiz });
});

export const PATCH = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").pop() as string;
  const body = await req.json().catch(() => ({}));
  const { data, error } = validateBody(updateQuizSchema, body);
  if (error) return error;

  const input = data as UpdateQuizInput;
  const quiz = await updateQuiz(id, input, req.user.userId, req.user.role);
  return NextResponse.json({ success: true, data: quiz });
});

export const DELETE = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").pop() as string;
  await softDeleteQuiz(id, req.user.userId, req.user.role);
  return NextResponse.json({ success: true, message: "Quiz deleted" });
});