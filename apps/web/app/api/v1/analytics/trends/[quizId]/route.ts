import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req) => {
  const quizId = req.nextUrl.pathname.split("/").filter(Boolean)[4] as string;
  const data = await analyticsService.getTrendAnalytics(req.user.userId, quizId);
  return NextResponse.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
});