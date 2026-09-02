import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/middleware/auth";

export const dynamic = "force-dynamic";

const verifyHandler = withAuth(async (req) => {
  const user = { userId: req.user.userId, email: req.user.email, role: req.user.role };
  return NextResponse.json({ success: true, data: { user } });
});

export { verifyHandler as POST };
