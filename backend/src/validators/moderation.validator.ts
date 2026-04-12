import { z } from "zod";

export const rejectSchema = z.object({
  review_comment: z
    .string()
    .trim()
    .min(1, "review_comment is required")
    .max(1000, "review_comment is too long"),
});