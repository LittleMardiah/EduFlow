import { NextRequest, NextResponse } from "next/server";
import { registerSchema, RegisterInput } from "@eduflow/core";
import { register } from "@eduflow/services";
import { validateBody } from "@/src/middleware/validation";

export const dynamic = "force-dynamic";

async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { data, error } = validateBody(registerSchema, body);
  if (error) return error;

  const input = data as RegisterInput;
  const result = await register(input.email, input.password, input.first_name, input.last_name, input.role);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: result.error?.message || "Registration failed" } },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { success: true, data: { user: result.data!.user } },
    { status: 201 }
  );
}

export { POST };
