import { NextRequest, NextResponse } from "next/server";
import { loginSchema, LoginInput } from "@eduflow/core";
import { login } from "@eduflow/services";
import { validateBody } from "@/src/middleware/validation";

export const dynamic = "force-dynamic";

async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
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

export { POST };
