import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/auth.js";
import { verifyToken } from "../utils/jwt.js";

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}