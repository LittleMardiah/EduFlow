import { NextRequest, NextResponse } from "next/server";
import { loginSchema, registerSchema, LoginInput, RegisterInput } from "@eduflow/core";
import { login, register } from "@eduflow/services";
import { getTokenFromRequest, verifyToken } from "@/src/middleware/auth";
import { validateBody } from "@/src/middleware/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: { actions: ["register", "login", "verify", "logout"] },
    meta: {
      note: "POST /api/v1/auth with ?action=register|login|verify|logout, or use /api/v1/auth/<action>",
    },
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "login" || action === "register") {
    const body = await req.json().catch(() => ({}));
    if (action === "login") {
      const { data, error } = validateBody(loginSchema, body);
      if (error) return error;
      const input = data as LoginInput;
      const result = await login(input.email, input.password);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: { message: result.error?.message || "Login failed" } },
          { status: 401 }
        );
      }
      const { user, token } = result.data as { user: any; token: string };
      const { password_hash, ...userWithoutPassword } = user;
      return NextResponse.json({ success: true, data: { user: userWithoutPassword, token } });
    }

    const { data: rData, error: rError } = validateBody(registerSchema, body);
    if (rError) return rError;
    const input = rData as RegisterInput;
    const result = await register(input.email, input.password, input.first_name, input.last_name, input.role);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: result.error?.message || "Registration failed" } },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, data: { user: result.data!.user } }, { status: 201 });
  }

  if (action === "verify") {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized: No token provided" } },
        { status: 401 }
      );
    }
    try {
      const user = verifyToken(token);
      return NextResponse.json({ success: true, data: { user } });
    } catch {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized: Invalid or expired token" } },
        { status: 401 }
      );
    }
  }

  if (action === "logout") {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized: No token provided" } },
        { status: 401 }
      );
    }
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  }

  return NextResponse.json(
    { success: false, error: { message: "Missing or invalid ?action= (register|login|verify|logout)" } },
    { status: 400 }
  );
}
