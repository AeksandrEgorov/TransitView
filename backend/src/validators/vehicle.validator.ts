// This validator checks vehicle create and update request bodies.
// It also makes sure new model, company, branch, and city fields are sent together correctly.

import { z } from "zod";

const vehicleConditionSchema = z.enum([
  "Töökorras",
  "Ei_tööta",
  "Maha_kantud",
  "Müüdud",
  "Teadmata",
]);

const optionalPositiveNumber = z
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
  });

const optionalString = (max: number) =>
  z
    .union([z.string().trim().max(max), z.literal(""), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }

      return value;
    });

export const createVehicleSchema = z
  .object({
    model_id: optionalPositiveNumber,

    new_model_manufacturer: optionalString(100),
    new_model_name: optionalString(100),
    new_model_category_id: optionalPositiveNumber,

    branch_id: optionalPositiveNumber,

    new_branch_name: optionalString(100),

    new_branch_company_id: optionalPositiveNumber,

    new_company_name: optionalString(150),
    new_company_city_id: optionalPositiveNumber,
    new_company_city_name: optionalString(100),
    new_company_city_county_id: optionalPositiveNumber,

    new_branch_city_id: optionalPositiveNumber,
    new_branch_city_name: optionalString(100),
    new_branch_city_county_id: optionalPositiveNumber,

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

    vin_code: optionalString(30),
    chassis: optionalString(100),

    condition: vehicleConditionSchema.optional().default("Teadmata"),

    city_id: optionalPositiveNumber,

    new_city_name: optionalString(100),
    new_city_county_id: optionalPositiveNumber,

    place: optionalString(200),

    taken_at: z
      .union([z.string().datetime(), z.literal(""), z.null(), z.undefined()])
      .transform((value) => {
        if (value === "" || value === null || value === undefined) {
          return null;
        }

        return value;
      }),
  })
  .superRefine((data, ctx) => {
    const hasExistingModel = Boolean(data.model_id);

    const hasNewModel =
      Boolean(data.new_model_manufacturer) &&
      Boolean(data.new_model_name) &&
      Boolean(data.new_model_category_id);

    if (!hasExistingModel && !hasNewModel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["model_id"],
        message: "model_id or new model data is required",
      });
    }

    const hasAnyNewModelField =
      Boolean(data.new_model_manufacturer) ||
      Boolean(data.new_model_name) ||
      Boolean(data.new_model_category_id);

    if (!hasNewModel && hasAnyNewModelField) {
      if (!data.new_model_manufacturer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_model_manufacturer"],
          message: "new_model_manufacturer is required",
        });
      }

      if (!data.new_model_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_model_name"],
          message: "new_model_name is required",
        });
      }

      if (!data.new_model_category_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_model_category_id"],
          message: "new_model_category_id is required",
        });
      }
    }

    const hasAnyNewBranchField =
      Boolean(data.new_branch_name) ||
      Boolean(data.new_branch_company_id) ||
      Boolean(data.new_company_name) ||
      Boolean(data.new_company_city_id) ||
      Boolean(data.new_company_city_name) ||
      Boolean(data.new_company_city_county_id) ||
      Boolean(data.new_branch_city_id) ||
      Boolean(data.new_branch_city_name) ||
      Boolean(data.new_branch_city_county_id);

    if (hasAnyNewBranchField) {
      const hasExistingCompany = Boolean(data.new_branch_company_id);

      const hasNewCompany =
        Boolean(data.new_company_name) &&
        (Boolean(data.new_company_city_id) ||
          (Boolean(data.new_company_city_name) &&
            Boolean(data.new_company_city_county_id)));

      if (!hasExistingCompany && !hasNewCompany) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_branch_company_id"],
          message: "company_id or new company data is required for new branch",
        });
      }

      if (data.new_company_name) {
        const hasCompanyCity =
          Boolean(data.new_company_city_id) ||
          (Boolean(data.new_company_city_name) &&
            Boolean(data.new_company_city_county_id));

        if (!hasCompanyCity) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["new_company_city_id"],
            message:
              "company city_id or new company city data is required for new company",
          });
        }
      }

      if (data.new_company_city_name && !data.new_company_city_county_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_company_city_county_id"],
          message: "new_company_city_county_id is required",
        });
      }

      if (!data.new_company_city_name && data.new_company_city_county_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_company_city_name"],
          message: "new_company_city_name is required",
        });
      }

      const hasExistingBranchCity = Boolean(data.new_branch_city_id);

      const hasNewBranchCity =
        Boolean(data.new_branch_city_name) &&
        Boolean(data.new_branch_city_county_id);

      if (!hasExistingBranchCity && !hasNewBranchCity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_branch_city_id"],
          message: "branch city_id or new branch city data is required",
        });
      }

      if (data.new_branch_city_name && !data.new_branch_city_county_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_branch_city_county_id"],
          message: "new_branch_city_county_id is required",
        });
      }

      if (!data.new_branch_city_name && data.new_branch_city_county_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_branch_city_name"],
          message: "new_branch_city_name is required",
        });
      }
    }

    const hasExistingPhotoCity = Boolean(data.city_id);

    const hasNewPhotoCity =
      Boolean(data.new_city_name) && Boolean(data.new_city_county_id);

    const hasPlace = Boolean(data.place);

    if (!hasExistingPhotoCity && !hasNewPhotoCity && !hasPlace) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["place"],
        message: "place is required when city_id or new city is not provided",
      });
    }

    if (data.new_city_name && !data.new_city_county_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_city_county_id"],
        message: "new_city_county_id is required when new_city_name is provided",
      });
    }

    if (!data.new_city_name && data.new_city_county_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_city_name"],
        message: "new_city_name is required when new_city_county_id is provided",
      });
    }
  });

export const updateVehicleSchema = z
  .object({
    model_id: optionalPositiveNumber.optional(),

    new_model_manufacturer: optionalString(100).optional(),
    new_model_name: optionalString(100).optional(),
    new_model_category_id: optionalPositiveNumber.optional(),

    branch_id: optionalPositiveNumber.optional(),

    new_branch_name: optionalString(100).optional(),

    new_branch_company_id: optionalPositiveNumber.optional(),

    new_company_name: optionalString(150).optional(),
    new_company_city_id: optionalPositiveNumber.optional(),
    new_company_city_name: optionalString(100).optional(),
    new_company_city_county_id: optionalPositiveNumber.optional(),

    new_branch_city_id: optionalPositiveNumber.optional(),
    new_branch_city_name: optionalString(100).optional(),
    new_branch_city_county_id: optionalPositiveNumber.optional(),

    reg_number: z.string().trim().min(1).max(20).optional(),

    vla_year: z
      .union([z.coerce.number().int(), z.literal(""), z.null(), z.undefined()])
      .transform((value) => {
        if (value === "" || value === null || value === undefined) {
          return null;
        }

        return value;
      })
      .optional(),

    vin_code: optionalString(30).optional(),
    chassis: optionalString(100).optional(),

    condition: vehicleConditionSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const hasNewModel =
      Boolean(data.new_model_manufacturer) &&
      Boolean(data.new_model_name) &&
      Boolean(data.new_model_category_id);

    const hasAnyNewModelField =
      Boolean(data.new_model_manufacturer) ||
      Boolean(data.new_model_name) ||
      Boolean(data.new_model_category_id);

    if (!hasNewModel && hasAnyNewModelField) {
      if (!data.new_model_manufacturer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_model_manufacturer"],
          message: "new_model_manufacturer is required",
        });
      }

      if (!data.new_model_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_model_name"],
          message: "new_model_name is required",
        });
      }

      if (!data.new_model_category_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_model_category_id"],
          message: "new_model_category_id is required",
        });
      }
    }

    const hasAnyNewBranchField =
      Boolean(data.new_branch_name) ||
      Boolean(data.new_branch_company_id) ||
      Boolean(data.new_company_name) ||
      Boolean(data.new_company_city_id) ||
      Boolean(data.new_company_city_name) ||
      Boolean(data.new_company_city_county_id) ||
      Boolean(data.new_branch_city_id) ||
      Boolean(data.new_branch_city_name) ||
      Boolean(data.new_branch_city_county_id);

    if (hasAnyNewBranchField) {
      const hasExistingCompany = Boolean(data.new_branch_company_id);

      const hasNewCompany =
        Boolean(data.new_company_name) &&
        (Boolean(data.new_company_city_id) ||
          (Boolean(data.new_company_city_name) &&
            Boolean(data.new_company_city_county_id)));

      if (!hasExistingCompany && !hasNewCompany) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_branch_company_id"],
          message: "company_id or new company data is required for new branch",
        });
      }

      if (data.new_company_name) {
        const hasCompanyCity =
          Boolean(data.new_company_city_id) ||
          (Boolean(data.new_company_city_name) &&
            Boolean(data.new_company_city_county_id));

        if (!hasCompanyCity) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["new_company_city_id"],
            message:
              "company city_id or new company city data is required for new company",
          });
        }
      }

      if (data.new_company_city_name && !data.new_company_city_county_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_company_city_county_id"],
          message: "new_company_city_county_id is required",
        });
      }

      if (!data.new_company_city_name && data.new_company_city_county_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_company_city_name"],
          message: "new_company_city_name is required",
        });
      }

      const hasExistingBranchCity = Boolean(data.new_branch_city_id);

      const hasNewBranchCity =
        Boolean(data.new_branch_city_name) &&
        Boolean(data.new_branch_city_county_id);

      if (!hasExistingBranchCity && !hasNewBranchCity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_branch_city_id"],
          message: "branch city_id or new branch city data is required",
        });
      }

      if (data.new_branch_city_name && !data.new_branch_city_county_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_branch_city_county_id"],
          message: "new_branch_city_county_id is required",
        });
      }

      if (!data.new_branch_city_name && data.new_branch_city_county_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_branch_city_name"],
          message: "new_branch_city_name is required",
        });
      }
    }
  });
