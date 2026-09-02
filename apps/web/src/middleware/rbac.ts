import { NextResponse } from "next/server";
import type { UserRole } from "@eduflow/core";
import type { AuthenticatedRequest } from "./auth";

export function requireRole(...roles: UserRole[]) {
  return async (req: AuthenticatedRequest): Promise<NextResponse | null> => {
    if (!req.user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }
    if (!roles.includes(req.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Forbidden: Role ${req.user.role} not allowed. Required: ${roles.join(", ")}`,
          },
        },
        { status: 403 }
      );
    }
    return null;
  };
}