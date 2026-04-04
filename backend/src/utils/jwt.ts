import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types/auth.js";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in .env");
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }

  return decoded as JwtPayload;
}