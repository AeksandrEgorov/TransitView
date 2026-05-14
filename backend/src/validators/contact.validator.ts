// This validator checks the public contact form body.
// It keeps names, emails, topics, and messages within the limits the frontend shows.

import { z } from "zod";

export const contactSchema = z.object({
  contactType: z.enum(["account", "question", "bug", "suggestion"]),
  fullName: z
    .string()
    .trim()
    .min(2, "fullName is required")
    .max(100, "fullName is too long"),
  email: z
    .string()
    .trim()
    .email("email must be valid")
    .max(150, "email is too long"),
  topic: z
    .string()
    .trim()
    .min(1, "topic is required")
    .max(150, "topic is too long"),
  message: z
    .string()
    .trim()
    .min(10, "message is too short")
    .max(5000, "message is too long"),
});

export type ContactInput = z.infer<typeof contactSchema>;
