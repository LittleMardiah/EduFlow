import { NextRequest, NextResponse } from "next/server";
import { updateEventSchema } from "@eduflow/core";
import { eventService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";
import { validateBody } from "@/src/middleware/validation";

export const dynamic = "force-dynamic";

function getEventId(req: NextRequest): string {
  return req.nextUrl.pathname.split("/").filter(Boolean)[3] as string;
}

export const GET = withAuth(async (req) => {
  const event = await eventService.getEventDetails(getEventId(req), req.user.userId, req.user.role);
  return NextResponse.json({ success: true, data: event });
});

export const PATCH = withAuth(async (req) => {
  const body = await req.json().catch(() => ({}));
  const { data, error } = validateBody(updateEventSchema, body);
  if (error) return error;

  const event = await eventService.updateEvent(getEventId(req), data as any, req.user.userId);
  return NextResponse.json({ success: true, data: event });
});

export const DELETE = withAuth(async (req) => {
  await eventService.deleteEvent(getEventId(req), req.user.userId);
  return NextResponse.json({ success: true, message: "Event deleted" });
});