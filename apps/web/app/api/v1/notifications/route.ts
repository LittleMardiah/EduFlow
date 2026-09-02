import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req) => {
  const unread = req.nextUrl.searchParams.get("unread") === "true";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0", 10);

  const result = await notificationService.getUserNotifications(req.user.userId, unread, limit, offset);
  return NextResponse.json({
    success: true,
    data: result.notifications,
    meta: {
      timestamp: new Date().toISOString(),
      total: result.total,
      unread_count: result.unread_count,
      page: result.page,
      limit: result.limit,
    },
  });
});