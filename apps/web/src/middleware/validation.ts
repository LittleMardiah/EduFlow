import { NextResponse, type NextRequest } from "next/server";
import { ZodSchema, ZodError } from "zod";

export function validateBody<T>(schema: ZodSchema<T>, body: unknown) {
  try {
    const parsed = schema.parse(body);
    return { data: parsed, error: null as NextResponse | null };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        data: null as T | null,
        error: NextResponse.json(
          {
            success: false,
            error: {
              message: "Validation failed",
              details: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
              })),
            },
          },
          { status: 400 }
        ),
      };
    }
    return {
      data: null as T | null,
      error: NextResponse.json(
        { success: false, error: { message: "Validation failed" } },
        { status: 400 }
      ),
    };
  }
}

export async function parseJsonBody(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}