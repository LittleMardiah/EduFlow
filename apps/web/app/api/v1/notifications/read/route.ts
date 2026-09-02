import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";

export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (req) => {
  const result = await notificationService.markAllAsRead(req.user.userId);
  return NextResponse.json({
    success: true,
    data: { updated: result.count },
    meta: { timestamp: new Date().toISOString() },
  });
});