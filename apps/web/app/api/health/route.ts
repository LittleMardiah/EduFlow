import { NextResponse } from "next/server";
import { AppError, USER_ROLES, toSlug } from "@eduflow/core";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "eduflow-web",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    moduleCheck: {
      roles: USER_ROLES,
      slug: toSlug("EduFlow Migration M1"),
      errorClass: AppError.name,
    },
  });
}