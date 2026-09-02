import { NextRequest, NextResponse } from "next/server";
import { archiveQuiz } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";

export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").filter(Boolean)[3] as string;
  const quiz = await archiveQuiz(id, req.user.userId, req.user.role);
  return NextResponse.json({ success: true, data: quiz });
});