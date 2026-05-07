import type { Response } from "express";
import bcrypt from "bcrypt";

import type { AuthRequest } from "../types/auth.js";
import {
  createUser,
  deleteUser,
  getUserById,
  getUserByUsername,
  getUsers,
  updateUser,
} from "../services/user.service.js";
import {
  createUserSchema,
  updateUserSchema,
} from "../validators/user.validator.js";

type UserRoleValue = "Kasutaja" | "Andmebaasi_toimetaja" | "Administraator";

type UserListQuery = {
  page?: string | string[];
  limit?: string | string[];
  role?: string | string[];
  search?: string | string[];
};

function getSingleString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
}

function parseUserRole(value: unknown): UserRoleValue | undefined | null {
  const role = getSingleString(value);

  if (!role) {
    return undefined;
  }

  if (role === "Kasutaja") return "Kasutaja";
  if (role === "Andmebaasi_toimetaja") return "Andmebaasi_toimetaja";
  if (role === "Administraator") return "Administraator";

  return null;
}

function parsePositiveId(value: unknown) {
  const rawValue = getSingleString(value);
  const id = Number(rawValue);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function isPrismaNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}

function isPrismaUniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function isPrismaForeignKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2003"
  );
}

export async function getUsersHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const query = req.query as UserListQuery;

    const page = Math.max(Number(getSingleString(query.page)) || 1, 1);

    const limit = Math.min(
      Math.max(Number(getSingleString(query.limit)) || 10, 1),
      50
    );

    const role = parseUserRole(query.role);

    if (role === null) {
      res.status(400).json({
        message:
          "Invalid role. Allowed values: Kasutaja, Andmebaasi_toimetaja, Administraator",
      });
      return;
    }

    const result = await getUsers({
      page,
      limit,
      role,
      search: getSingleString(query.search)?.trim() || undefined,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getUserHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId = parsePositiveId(req.params.id);

    if (!userId) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createUserHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const parsed = createUserSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const body = parsed.data;

    if (body.role === "Administraator") {
      res.status(403).json({
        message: "Creating another administrator is not allowed",
      });
      return;
    }

    const existingUser = await getUserByUsername(body.username);

    if (existingUser) {
      res.status(409).json({
        message: "Username already exists",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await createUser({
      username: body.username,
      password_hash: passwordHash,
      role: body.role,
    });

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      res.status(409).json({
        message: "Username already exists",
      });
      return;
    }

    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateUserHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId = parsePositiveId(req.params.id);

    if (!userId) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    const parsed = updateUserSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const body = parsed.data;

    const existingUser = await getUserById(userId);

    if (!existingUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (body.role === "Administraator") {
      res.status(403).json({
        message: "Assigning administrator role is not allowed",
      });
      return;
    }

    if (body.username) {
      const userWithSameUsername = await getUserByUsername(body.username);

      if (userWithSameUsername && userWithSameUsername.user_id !== userId) {
        res.status(409).json({
          message: "Username already exists",
        });
        return;
      }
    }

    const updateData: {
      username?: string;
      password_hash?: string;
      role?: UserRoleValue;
    } = {};

    if (body.username !== undefined) {
      updateData.username = body.username;
    }

    if (body.role !== undefined) {
      updateData.role = body.role;
    }

    if (body.password !== undefined) {
      updateData.password_hash = await bcrypt.hash(body.password, 10);
    }

    const updatedUser = await updateUser(userId, updateData);

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (isPrismaUniqueError(error)) {
      res.status(409).json({
        message: "Username already exists",
      });
      return;
    }

    console.error("Update user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteUserHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId = parsePositiveId(req.params.id);

    if (!userId) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    if (req.user?.userId === userId) {
      res.status(400).json({
        message: "You cannot delete your own account",
      });
      return;
    }

    const existingUser = await getUserById(userId);

    if (!existingUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (existingUser.role === "Administraator") {
      res.status(403).json({
        message: "Administrator account cannot be deleted",
      });
      return;
    }

    const deletedUser = await deleteUser(userId);

    res.status(200).json({
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (isPrismaForeignKeyError(error)) {
      res.status(409).json({
        message:
          "User cannot be deleted because they have related vehicles or photos",
      });
      return;
    }

    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}