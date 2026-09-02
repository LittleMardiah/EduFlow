import { NextRequest, NextResponse } from "next/server";
import { createEventSchema, listEventsQuerySchema } from "@eduflow/core";
import { eventService } from "@eduflow/services";
import { withAuth } from "@/src/middleware/auth";
import { requireRole } from "@/src/middleware/rbac";
import { validateBody } from "@/src/middleware/validation";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req) => {
  const { searchParams } = req.nextUrl;
  const parsed = listEventsQuerySchema.safeParse({
    status: searchParams.get("status") || undefined,
    quiz_id: searchParams.get("quiz_id") || undefined,
    instructor_id: searchParams.get("instructor_id") || undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: "Invalid query", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const events = await eventService.listEvents(parsed.data as any, req.user.userId, req.user.role);
  return NextResponse.json({ success: true, data: events });
});

export const POST = withAuth(async (req) => {
  const roleCheck = await requireRole("instructor", "admin")(req);
  if (roleCheck) return roleCheck;

  const body = await req.json().catch(() => ({}));
  const { data, error } = validateBody(createEventSchema, body);
  if (error) return error;

  const event = await eventService.createEvent(data as any, req.user.userId);
  return NextResponse.json(
    { success: true, data: event, meta: { timestamp: new Date().toISOString() } },
    { status: 201 }
  );
});