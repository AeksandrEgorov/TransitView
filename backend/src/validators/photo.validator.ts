import { z } from "zod";

export const createPhotoSchema = z
  .object({
    vehicle_id: z.coerce
      .number()
      .int()
      .positive("vehicle_id must be a positive number"),

    city_id: z
      .union([
        z.coerce.number().int().positive(),
        z.literal(""),
        z.null(),
        z.undefined(),
      ])
      .transform((value) => {
        if (value === "" || value === null || value === undefined) {
          return null;
        }

        return value;
      }),

    place: z
      .union([
        z.string().trim().max(200, "place must be at most 200 characters"),
        z.literal(""),
        z.null(),
        z.undefined(),
      ])
      .transform((value) => {
        if (value === "" || value === null || value === undefined) {
          return null;
        }

        return value;
      }),

    taken_at: z
      .union([z.string().datetime(), z.literal(""), z.null(), z.undefined()])
      .transform((value) => {
        if (value === "" || value === null || value === undefined) {
          return null;
        }

        return value;
      }),

    file_path: z
      .string()
      .trim()
      .min(1, "file_path is required")
      .url("file_path must be a valid URL"),

    cloudinary_public_id: z.string().trim().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.city_id === null && !data.place) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["place"],
        message: "place is required when city_id is missing",
      });
    }
  });

export const updatePhotoSchema = z
  .object({
    city_id: z.union([z.coerce.number().int().positive(), z.null()]).optional(),

    place: z.string().trim().max(200).optional().nullable(),

    taken_at: z.union([z.string().datetime(), z.null()]).optional(),

    file_path: z.string().url().optional(),

    cloudinary_public_id: z.string().trim().min(1).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.city_id === null && !data.place) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["place"],
        message: "place is required when city_id is missing",
      });
    }
  });