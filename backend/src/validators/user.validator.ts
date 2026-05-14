// This file checks user request data.

import { z } from "zod";

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "username is required")
    .max(50, "username is too long"),

  email: z
    .string()
    .trim()
    .min(1, "email is required")
    .email("email must be valid")
    .max(100, "email is too long"),

  password: z
    .string()
    .min(6, "password must be at least 6 characters")
    .max(100, "password is too long"),

  role: z.enum(["Kasutaja", "Andmebaasi_toimetaja", "Administraator"]),
});

export const updateUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "username cannot be empty")
    .max(50, "username is too long")
    .optional(),

  email: z
    .string()
    .trim()
    .min(1, "email cannot be empty")
    .email("email must be valid")
    .max(100, "email is too long")
    .optional(),

  password: z
    .string()
    .min(6, "password must be at least 6 characters")
    .max(100, "password is too long")
    .optional(),

  role: z.enum(["Kasutaja", "Andmebaasi_toimetaja", "Administraator"]).optional(),
});