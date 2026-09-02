import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";

export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").filter(Boolean)[3] as string;
  const notification = await notificationService.markAsRead(id, req.user.userId);
  return NextResponse.json({
    success: true,
    data: notification,
    meta: { timestamp: new Date().toISOString() },
  });
});