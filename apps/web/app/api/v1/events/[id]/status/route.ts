import { NextRequest, NextResponse } from "next/server";
import { updateEventStatusSchema } from "@eduflow/core";
import { eventService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";
import { validateBody } from "@/src/middleware/validation";

export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").filter(Boolean)[3] as string;
  const body = await req.json().catch(() => ({}));
  const { data, error } = validateBody(updateEventStatusSchema, body);
  if (error) return error;

  const status = (data as { status: "scheduled" | "in_progress" | "completed" | "cancelled" }).status;
  const event = await eventService.updateEventStatus(id, status, req.user.userId, req.user.role);
  return NextResponse.json({ success: true, data: event });
});