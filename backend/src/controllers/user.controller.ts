import type { Response } from "express";
import bcrypt from "bcrypt";
import type { AuthRequest } from "../types/auth.js";
import type { CreateUserBody, UpdateUserBody } from "../types/user.js";
import {
  getAllUsers,
  getUserById,
  getUserByUsername,
  createUser,
  updateUser,
  deleteUser,
} from "../services/user.service.js";

export async function getUsersHandler(
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const users = await getAllUsers();

    res.status(200).json(users);
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
    const userId = Number(req.params.id);

    if (Number.isNaN(userId)) {
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
    const body = req.body as CreateUserBody;

    if (!body.username || !body.password || !body.role) {
      res.status(400).json({
        message: "username, password and role are required",
      });
      return;
    }

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
    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateUserHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId = Number(req.params.id);

    if (Number.isNaN(userId)) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    const body = req.body as UpdateUserBody;

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
      role?: "Kasutaja" | "Andmebaasi_toimetaja" | "Administraator";
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
    console.error("Update user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteUserHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId = Number(req.params.id);

    if (Number.isNaN(userId)) {
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
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}