import type { Response } from "express";
import bcrypt from "bcrypt";

import type { AuthRequest } from "../types/auth.js";
import type { UserListQuery } from "../types/user.js";
import { UserRole } from "../generated/prisma/client.js";

import {
  createUser,
  deleteUser,
  getUserByEmail,
  getUserById,
  getUserByUsername,
  getUsers,
  updateUser,
} from "../services/user.service.js";

import {
  createUserSchema,
  updateUserSchema,
} from "../validators/user.validator.js";

function getSingleString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
}

function parsePositiveId(value: unknown) {
  const rawValue = getSingleString(value);
  const id = Number(rawValue);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function parseUserRole(value: unknown): UserRole | undefined | null {
  const rawValue = getSingleString(value);

  if (!rawValue) {
    return undefined;
  }

  if (Object.values(UserRole).includes(rawValue as UserRole)) {
    return rawValue as UserRole;
  }

  return null;
}

function parseDateQuery(
  value: unknown,
  endOfDay = false
): Date | null | undefined {
  const rawValue = getSingleString(value);

  if (!rawValue) {
    return undefined;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(rawValue);

  const date = isDateOnly
    ? new Date(`${rawValue}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`)
    : new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
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

    const createdFrom = parseDateQuery(query.createdFrom);
    const createdTo = parseDateQuery(query.createdTo, true);

    if (createdFrom === null) {
      res.status(400).json({ message: "Invalid createdFrom date format" });
      return;
    }

    if (createdTo === null) {
      res.status(400).json({ message: "Invalid createdTo date format" });
      return;
    }

    if (createdFrom && createdTo && createdFrom > createdTo) {
      res.status(400).json({
        message: "createdFrom cannot be later than createdTo",
      });
      return;
    }

    const result = await getUsers({
      page,
      limit,
      role,
      search: getSingleString(query.search)?.trim() || undefined,
      createdFrom,
      createdTo,
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

    if (body.role === UserRole.Administraator) {
      res.status(403).json({
        message: "Creating another administrator is not allowed",
      });
      return;
    }

    const existingUsername = await getUserByUsername(body.username);

    if (existingUsername) {
      res.status(409).json({
        message: "Username already exists",
      });
      return;
    }

    const existingEmail = await getUserByEmail(body.email);

    if (existingEmail) {
      res.status(409).json({
        message: "Email already exists",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await createUser({
      username: body.username,
      email: body.email,
      password_hash: passwordHash,
      role: body.role as UserRole,
    });

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      res.status(409).json({
        message: "Username or email already exists",
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

    if (body.role === UserRole.Administraator) {
      res.status(403).json({
        message: "Assigning administrator role is not allowed",
      });
      return;
    }

    if (req.user?.userId === userId && body.role !== undefined) {
      res.status(400).json({
        message: "You cannot change your own role",
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

    if (body.email) {
      const userWithSameEmail = await getUserByEmail(body.email);

      if (userWithSameEmail && userWithSameEmail.user_id !== userId) {
        res.status(409).json({
          message: "Email already exists",
        });
        return;
      }
    }

    const updateData: {
      username?: string;
      email?: string;
      password_hash?: string;
      role?: UserRole;
    } = {};

    if (body.username !== undefined) {
      updateData.username = body.username;
    }

    if (body.email !== undefined) {
      updateData.email = body.email;
    }

    if (body.role !== undefined) {
      updateData.role = body.role as UserRole;
    }

    if (body.password !== undefined) {
      updateData.password_hash = await bcrypt.hash(body.password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        message: "No fields provided for update",
      });
      return;
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
        message: "Username or email already exists",
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

    if (existingUser.role === UserRole.Administraator) {
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