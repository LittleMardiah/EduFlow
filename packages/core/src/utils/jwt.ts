import jwt from "jsonwebtoken";
import { UserRole } from "../types/domain";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  organization_id?: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_at_least_32_characters";
const JWT_EXPIRATION = parseInt(process.env.JWT_EXPIRATION_SECONDS || "86400", 10);

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
    algorithm: "HS256",
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}