// This file checks auth request data.

import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .max(50, "Username is too long"),

  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password is too long"),
});