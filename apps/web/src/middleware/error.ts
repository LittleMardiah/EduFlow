import { NextResponse, type NextRequest } from "next/server";
import { AppError } from "@eduflow/core";

export function toErrorResponse(error: unknown, fallbackStatus = 500): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message, code: error.code, details: error.details },
      },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : String(error);

  // Prisma error codes
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    if (code === "P2025" || code === "P2023") {
      return NextResponse.json(
        { success: false, error: { message: "Record not found" } },
        { status: 404 }
      );
    }
  }

  let status = fallbackStatus;
  if (/not found/i.test(message)) status = 404;
  else if (/unauthorized|invalid credentials|expired/i.test(message)) status = 401;
  else if (/forbidden|not allowed|permission|do not (have|own)/i.test(message)) status = 403;
  else if (/validation|required|invalid|should|must|already/i.test(message)) status = 400;

  return NextResponse.json(
    { success: false, error: { message } },
    { status }
  );
}

export function withErrorHandler(
  handler: (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      console.error("[API Error]", error);
      return toErrorResponse(error);
    }
  };
}