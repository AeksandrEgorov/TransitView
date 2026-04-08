import { z } from "zod";

export const createVehicleSchema = z.object({
  model_id: z.coerce.number().int().positive("model_id must be a positive number"),

  branch_id: z
    .union([z.coerce.number().int().positive(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }
      return value;
    }),

  reg_number: z
    .string()
    .trim()
    .min(1, "reg_number is required")
    .max(20, "reg_number is too long"),

  vla_year: z
    .union([z.coerce.number().int(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }
      return value;
    }),

  vin_code: z
    .union([z.string().trim().max(30), z.literal(""), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }
      return value;
    }),

  chassis: z
    .union([z.string().trim().max(100), z.literal(""), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }
      return value;
    }),

  condition: z
    .enum([
      "Töökorras",
      "Ei_tööta",
      "Maha_kantud",
      "Müüdud",
      "Teadmata",
    ])
    .optional()
    .default("Teadmata"),

  city_id: z.coerce.number().int().positive("city_id must be a positive number"),

  place: z
    .string()
    .trim()
    .min(1, "place is required")
    .max(200, "place is too long"),

  taken_at: z
    .union([z.string().datetime(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }
      return value;
    }),
});

export const updateVehicleSchema = z.object({
  model_id: z.coerce.number().int().positive().optional(),

  branch_id: z
    .union([z.coerce.number().int().positive(), z.null()])
    .optional(),

  reg_number: z.string().trim().min(1).max(20).optional(),

  vla_year: z.coerce.number().int().optional().nullable(),

  vin_code: z.string().trim().max(30).optional().nullable(),

  chassis: z.string().trim().max(100).optional().nullable(),

  condition: z
    .enum([
      "Töökorras",
      "Ei_tööta",
      "Maha_kantud",
      "Müüdud",
      "Teadmata",
    ])
    .optional(),
});