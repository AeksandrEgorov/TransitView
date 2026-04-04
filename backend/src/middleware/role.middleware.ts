import type { Response, NextFunction } from "express";
import type { AuthRequest, AppRole } from "../types/auth.js";

export function requireRole(...allowedRoles: AppRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    next();
  };
}