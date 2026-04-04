import type { Request } from "express";

export type AppRole = "Kasutaja" | "Andmebaasi_toimetaja" | "Administraator";

export interface JwtPayload {
  userId: number;
  username: string;
  role: AppRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}