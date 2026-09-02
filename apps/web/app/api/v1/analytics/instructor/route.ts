import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";
import { requireRole } from "@/src/middleware/rbac";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req) => {
  const roleCheck = await requireRole("instructor", "admin")(req);
  if (roleCheck) return roleCheck;

  const quizId = req.nextUrl.searchParams.get("quiz_id") || undefined;
  const eventId = req.nextUrl.searchParams.get("event_id") || undefined;
  const data = await analyticsService.getInstructorAnalytics(req.user.userId, quizId, eventId);
  return NextResponse.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
});