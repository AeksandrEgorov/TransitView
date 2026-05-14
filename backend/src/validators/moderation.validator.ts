// This file checks moderation request data.

import { z } from "zod";

import {
  ReviewStatus,
  VehicleCondition,
} from "../generated/prisma/client.js";

function emptyStringToNull(value: unknown) {
  if (value === "") {
    return null;
  }

  return value;
}

function optionalNullablePositiveInt() {
  return z
    .preprocess(
      emptyStringToNull,
      z.union([z.coerce.number().int().positive(), z.null()])
    )
    .optional();
}

function optionalNullableString(maxLength: number) {
  return z
    .preprocess(
      emptyStringToNull,
      z.union([z.string().trim().max(maxLength), z.null()])
    )
    .optional();
}

function optionalNullableDateString() {
  return z
    .preprocess(
      emptyStringToNull,
      z
        .union([
          z
            .string()
            .trim()
            .refine((value) => !Number.isNaN(new Date(value).getTime()), {
              message: "Invalid date format",
            }),
          z.null(),
        ])
    )
    .optional();
}

export const rejectSchema = z.object({
  review_comment: z.string().trim().min(1).max(1000),
});

export const updateManageVehicleSchema = z
  .object({
    model_id: z.coerce.number().int().positive().optional(),

    branch_id: optionalNullablePositiveInt(),

    reg_number: z.string().trim().min(1).max(20).optional(),

    vla_year: z
      .preprocess(
        emptyStringToNull,
        z.union([z.coerce.number().int().min(1900), z.null()])
      )
      .optional(),

    vin_code: optionalNullableString(30),

    chassis: optionalNullableString(100),

    condition: z.nativeEnum(VehicleCondition).optional(),

    status: z.nativeEnum(ReviewStatus).optional(),

    review_comment: optionalNullableString(1000),
  })
  .superRefine((data, ctx) => {
    if (
      data.status === ReviewStatus.Tagasi_lukatud &&
      (!data.review_comment || !data.review_comment.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["review_comment"],
        message: "review_comment is required when rejecting vehicle",
      });
    }
  });

export const updateManagePhotoSchema = z
  .object({
    vehicle_id: z.coerce.number().int().positive().optional(),

    author_id: z.coerce.number().int().positive().optional(),

    city_id: optionalNullablePositiveInt(),

    place: optionalNullableString(200),

    taken_at: optionalNullableDateString(),

    file_path: z.string().url().optional(),

    cloudinary_public_id: optionalNullableString(255),

    status: z.nativeEnum(ReviewStatus).optional(),

    review_comment: optionalNullableString(1000),
  })
  .superRefine((data, ctx) => {
    if (data.city_id === null && (!data.place || !data.place.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["place"],
        message: "place is required when city_id is missing",
      });
    }

    if (
      data.status === ReviewStatus.Tagasi_lukatud &&
      (!data.review_comment || !data.review_comment.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["review_comment"],
        message: "review_comment is required when rejecting photo",
      });
    }
  });

export type UpdateManageVehicleInput = z.infer<
  typeof updateManageVehicleSchema
>;

export type UpdateManagePhotoInput = z.infer<typeof updateManagePhotoSchema>;