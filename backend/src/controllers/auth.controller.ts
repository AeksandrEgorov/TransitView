import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import { signToken } from "../utils/jwt.js";
import type { AuthRequest } from "../types/auth.js";
import { loginSchema } from "../validators/auth.validator.js";

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, password } = parsed.data;

    const user = await prisma.users.findUnique({
      where: { username },
    });

    if (!user) {
      res.status(401).json({
        message: "Invalid username or password",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({
        message: "Invalid username or password",
      });
      return;
    }

    const token = signToken({
      userId: user.user_id,
      username: user.username,
      role: user.role,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const user = await prisma.users.findUnique({
      where: { user_id: req.user.userId },
      select: {
        user_id: true,
        username: true,
        role: true,
        created_at: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}