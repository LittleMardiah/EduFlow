import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, type TokenPayload } from "@eduflow/core";

export { verifyToken, type TokenPayload };

export type AuthenticatedRequest = NextRequest & { user: TokenPayload };

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  return token || null;
}

export function requireAuth(req: NextRequest): { user: TokenPayload; error: NextResponse | null } {
  const token = getTokenFromRequest(req);
  if (!token) {
    return {
      user: null as unknown as TokenPayload,
      error: NextResponse.json(
        { success: false, error: { message: "Unauthorized: No token provided" } },
        { status: 401 }
      ),
    };
  }
  try {
    const payload = verifyToken(token);
    return { user: payload, error: null };
  } catch {
    return {
      user: null as unknown as TokenPayload,
      error: NextResponse.json(
        { success: false, error: { message: "Unauthorized: Invalid or expired token" } },
        { status: 401 }
      ),
    };
  }
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { user, error } = requireAuth(req);
    if (error) return error;
    const authedReq = req as AuthenticatedRequest;
    authedReq.user = user;
    return handler(authedReq);
  };
}