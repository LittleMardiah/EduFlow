import { NextRequest, NextResponse } from "next/server";
import { publishQuiz } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";

export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").filter(Boolean)[3] as string;
  const body = await req.json().catch(() => ({}));
  const changeReason =
    (body as { change_reason?: string }).change_reason ||
    (body as { changeReason?: string }).changeReason;
  const quiz = await publishQuiz(id, req.user.userId, req.user.role, changeReason);
  return NextResponse.json({ success: true, data: quiz });
});