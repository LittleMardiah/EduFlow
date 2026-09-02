import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";

export const dynamic = "force-dynamic";

export const DELETE = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").filter(Boolean)[3] as string;
  await notificationService.deleteNotification(id, req.user.userId);
  return NextResponse.json({
    success: true,
    message: "Notification deleted",
    meta: { timestamp: new Date().toISOString() },
  });
});