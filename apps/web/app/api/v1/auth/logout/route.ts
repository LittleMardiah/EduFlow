import { NextResponse } from "next/server";
import { withAuth } from "@/src/middleware/auth";

export const dynamic = "force-dynamic";

const logoutHandler = withAuth(async () => {
  return NextResponse.json({ success: true, message: "Logged out successfully" });
});

export { logoutHandler as POST };
