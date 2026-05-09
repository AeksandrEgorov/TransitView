import { z } from "zod";

const optionalNullableString = (maxLength: number, fieldName: string) =>
  z
    .union([
      z.string().trim().max(maxLength, `${fieldName} must be at most ${maxLength} characters`),
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

const optionalDateString = z
  .union([
    z.string().trim().min(1),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .transform((value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    return value;
  })
  .refine(
    (value) => {
      if (value === null) {
        return true;
      }

      const date = new Date(value);
      return !Number.isNaN(date.getTime());
    },
    {
      message: "date must be a valid date",
    }
  );

const optionalCityId = z
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

const newCitySchema = z
  .object({
    name: z.string().trim().min(1, "City name is required").max(100),
    county_id: z.coerce
      .number()
      .int()
      .positive("county_id must be a positive number"),
  })
  .optional()
  .nullable();

const flatNewCityFieldsSchema = {
  new_city_name: z
    .union([
      z.string().trim().max(100, "new_city_name must be at most 100 characters"),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      return value;
    })
    .optional(),

  new_city_county_id: z
    .union([
      z.coerce.number().int().positive(),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      return value;
    })
    .optional(),
};

function hasNewCityData(data: {
  new_city?: { name: string; county_id: number } | null;
  new_city_name?: string;
  new_city_county_id?: number;
}) {
  return Boolean(
    data.new_city?.name ||
      (data.new_city_name && data.new_city_county_id)
  );
}

export const createPhotoSchema = z
  .object({
    vehicle_id: z.coerce
      .number()
      .int()
      .positive("vehicle_id must be a positive number"),

    city_id: optionalCityId,

    new_city: newCitySchema,
    ...flatNewCityFieldsSchema,

    place: optionalNullableString(200, "place"),

    taken_at: optionalDateString,

    file_path: z
      .string()
      .trim()
      .min(1, "file_path is required")
      .url("file_path must be a valid URL"),

    cloudinary_public_id: z
      .union([z.string().trim().min(1), z.literal(""), z.null(), z.undefined()])
      .transform((value) => {
        if (value === "" || value === null || value === undefined) {
          return null;
        }

        return value;
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const hasExistingCity = data.city_id !== null;
    const hasNewCity = hasNewCityData(data);

    if (!hasExistingCity && !hasNewCity && !data.place) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["place"],
        message: "place is required when city_id is missing",
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

export const updatePhotoSchema = z
  .object({
    city_id: optionalCityId.optional(),

    new_city: newCitySchema,
    ...flatNewCityFieldsSchema,

    place: optionalNullableString(200, "place").optional(),

    taken_at: optionalDateString.optional(),

    file_path: z.string().trim().url("file_path must be a valid URL").optional(),

    cloudinary_public_id: z
      .union([z.string().trim().min(1), z.literal(""), z.null(), z.undefined()])
      .transform((value) => {
        if (value === "" || value === null || value === undefined) {
          return null;
        }

        return value;
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const hasNewCity = hasNewCityData(data);

    if (data.city_id === null && !hasNewCity && !data.place) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["place"],
        message: "place is required when city_id is missing",
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