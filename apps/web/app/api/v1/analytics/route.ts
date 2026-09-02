import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";
import { requireRole } from "@/src/middleware/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  if (type === "student") {
    return withAuth(async (r) => {
      const quizId = url.searchParams.get("quiz_id") || undefined;
      const data = await analyticsService.getStudentAnalytics(r.user.userId, quizId);
      return NextResponse.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
    })(req);
  }

  if (type === "instructor") {
    return withAuth(async (r) => {
      const roleCheck = await requireRole("instructor", "admin")(r);
      if (roleCheck) return roleCheck;
      const quizId = url.searchParams.get("quiz_id") || undefined;
      const eventId = url.searchParams.get("event_id") || undefined;
      const data = await analyticsService.getInstructorAnalytics(r.user.userId, quizId, eventId);
      return NextResponse.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
    })(req);
  }

  if (type === "cohort") {
    return withAuth(async (r) => {
      const roleCheck = await requireRole("instructor", "admin")(r);
      if (roleCheck) return roleCheck;
      const eventId = url.searchParams.get("event_id");
      if (!eventId) {
        return NextResponse.json(
          { success: false, error: { message: "event_id query param is required" } },
          { status: 400 }
        );
      }
      const data = await analyticsService.getCohortAnalytics(eventId);
      return NextResponse.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
    })(req);
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        available: [
          "GET /api/v1/analytics/student",
          "GET /api/v1/analytics/student/:quizId",
          "GET /api/v1/analytics/instructor",
          "GET /api/v1/analytics/cohort/:eventId",
          "GET /api/v1/analytics/questions/:questionId",
          "GET /api/v1/analytics/trends/:quizId",
        ],
      },
    }
  );
}