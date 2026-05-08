import type { Response } from "express";

import type { AuthRequest } from "../types/auth.js";
import type { UpdatePhotoBody } from "../types/photo.js";
import {
  ReviewStatus,
  VehicleCondition,
} from "../generated/prisma/client.js";
import {
  approvePhoto,
  createPhoto,
  deletePhoto,
  getMyPhotoById,
  getMyPhotos,
  getPendingPhotos,
  getPhotoById,
  getPhotoForEdit,
  getPhotosByVehicleId,
  getPublicPhotos,
  rejectPhoto,
  updatePhoto,
} from "../services/photo.service.js";
import { uploadBufferToCloudinary } from "../utils/uploadToCloudinary.js";
import prisma from "../config/prisma.js";
import {
  createPhotoSchema,
  updatePhotoSchema,
} from "../validators/photo.validator.js";
import { rejectSchema } from "../validators/moderation.validator.js";

function getSingleString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
}

function parsePositiveInt(value: unknown): number | null {
  const rawValue = getSingleString(value);
  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseOptionalPositiveInt(value: unknown): number | undefined | null {
  const rawValue = getSingleString(value);

  if (!rawValue) {
    return undefined;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseDateQuery(
  value: unknown,
  endOfDay = false
): Date | null | undefined {
  const rawValue = getSingleString(value);

  if (!rawValue) {
    return undefined;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(rawValue);

  const date = isDateOnly
    ? new Date(`${rawValue}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`)
    : new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseReviewStatus(
  value: unknown
): ReviewStatus | undefined | null {
  const rawValue = getSingleString(value);

  if (!rawValue) {
    return undefined;
  }

  if (Object.values(ReviewStatus).includes(rawValue as ReviewStatus)) {
    return rawValue as ReviewStatus;
  }

  return null;
}

function parseVehicleCondition(
  value: unknown
): VehicleCondition | undefined | null {
  const rawValue = getSingleString(value);

  if (!rawValue) {
    return undefined;
  }

  if (Object.values(VehicleCondition).includes(rawValue as VehicleCondition)) {
    return rawValue as VehicleCondition;
  }

  return null;
}

function isHigherRole(req: AuthRequest) {
  return (
    req.user?.role === "Andmebaasi_toimetaja" ||
    req.user?.role === "Administraator"
  );
}

function isPrismaForeignKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2003"
  );
}

function isPrismaNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}

export async function uploadPhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, "transitview");

    res.status(200).json({
      message: "Image uploaded successfully",
      file_path: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload photo error:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
}

export async function getPhotosHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = Math.max(Number(getSingleString(req.query.page)) || 1, 1);

    const limit = Math.min(
      Math.max(Number(getSingleString(req.query.limit)) || 10, 1),
      50
    );

    const cityId = parseOptionalPositiveInt(req.query.cityId);
    const countyId = parseOptionalPositiveInt(req.query.countyId);
    const vehicleId = parseOptionalPositiveInt(req.query.vehicleId);
    const categoryId = parseOptionalPositiveInt(req.query.categoryId);

    if (
      cityId === null ||
      countyId === null ||
      vehicleId === null ||
      categoryId === null
    ) {
      res.status(400).json({ message: "Invalid numeric query parameter" });
      return;
    }

    const condition = parseVehicleCondition(req.query.condition);

    if (condition === null) {
      res.status(400).json({
        message:
          "Invalid condition. Allowed values: Töökorras, Ei_tööta, Maha_kantud, Müüdud, Teadmata",
      });
      return;
    }

    const createdFrom = parseDateQuery(req.query.createdFrom);
    const createdTo = parseDateQuery(req.query.createdTo, true);

    if (createdFrom === null) {
      res.status(400).json({ message: "Invalid createdFrom date format" });
      return;
    }

    if (createdTo === null) {
      res.status(400).json({ message: "Invalid createdTo date format" });
      return;
    }

    if (createdFrom && createdTo && createdFrom > createdTo) {
      res.status(400).json({
        message: "createdFrom cannot be later than createdTo",
      });
      return;
    }

    const result = await getPublicPhotos({
      page,
      limit,
      cityId,
      countyId,
      vehicleId,
      regNumber: getSingleString(req.query.regNumber)?.trim() || undefined,
      categoryId,
      condition,
      createdFrom,
      createdTo,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get photos error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const photoId = parsePositiveInt(req.params.id);

    if (!photoId) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const photo = await getPhotoById(photoId);

    if (!photo) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    res.status(200).json(photo);
  } catch (error) {
    console.error("Get photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getVehiclePhotosHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const vehicleId = parsePositiveInt(req.params.vehicleId);

    if (!vehicleId) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const page = Math.max(Number(getSingleString(req.query.page)) || 1, 1);

    const limit = Math.min(
      Math.max(Number(getSingleString(req.query.limit)) || 10, 1),
      50
    );

    const result = await getPhotosByVehicleId({
      vehicleId,
      page,
      limit,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get vehicle photos error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyPhotosHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const page = Math.max(Number(getSingleString(req.query.page)) || 1, 1);

    const limit = Math.min(
      Math.max(Number(getSingleString(req.query.limit)) || 10, 1),
      50
    );

    const status = parseReviewStatus(req.query.status);

    if (status === null) {
      res.status(400).json({
        message:
          "Invalid status. Allowed values: Ootel, Kinnitatud, Tagasi_lukatud",
      });
      return;
    }

    const cityId = parseOptionalPositiveInt(req.query.cityId);
    const countyId = parseOptionalPositiveInt(req.query.countyId);
    const categoryId = parseOptionalPositiveInt(req.query.categoryId);

    if (cityId === null || countyId === null || categoryId === null) {
      res.status(400).json({ message: "Invalid numeric query parameter" });
      return;
    }

    const condition = parseVehicleCondition(req.query.condition);

    if (condition === null) {
      res.status(400).json({
        message:
          "Invalid condition. Allowed values: Töökorras, Ei_tööta, Maha_kantud, Müüdud, Teadmata",
      });
      return;
    }

    const createdFrom = parseDateQuery(req.query.createdFrom);
    const createdTo = parseDateQuery(req.query.createdTo, true);

    if (createdFrom === null) {
      res.status(400).json({ message: "Invalid createdFrom date format" });
      return;
    }

    if (createdTo === null) {
      res.status(400).json({ message: "Invalid createdTo date format" });
      return;
    }

    if (createdFrom && createdTo && createdFrom > createdTo) {
      res.status(400).json({
        message: "createdFrom cannot be later than createdTo",
      });
      return;
    }

    const result = await getMyPhotos({
      userId: req.user.userId,
      page,
      limit,
      status,
      regNumber: getSingleString(req.query.regNumber)?.trim() || undefined,
      cityId,
      countyId,
      categoryId,
      condition,
      createdFrom,
      createdTo,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get my photos error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyPhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const photoId = parsePositiveInt(req.params.id);

    if (!photoId) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const photo = await getMyPhotoById(photoId, req.user.userId);

    if (!photo) {
      res.status(404).json({
        message: "Photo not found or you do not have access to it",
      });
      return;
    }

    res.status(200).json(photo);
  } catch (error) {
    console.error("Get my photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createPhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const parsed = createPhotoSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const body = parsed.data;

    const vehicle = await prisma.vehicles.findUnique({
      where: {
        vehicle_id: body.vehicle_id,
      },
    });

    if (!vehicle) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    const isOwner = vehicle.created_by === req.user.userId;

    if (!isOwner && !isHigherRole(req)) {
      res.status(403).json({
        message: "You cannot add a photo to this vehicle",
      });
      return;
    }

    const photo = await createPhoto({
      vehicle_id: body.vehicle_id,
      city_id: body.city_id,
      place: body.place,
      taken_at: body.taken_at,
      file_path: body.file_path,
      cloudinary_public_id: body.cloudinary_public_id,
      user_id: req.user.userId,
    });

    res.status(201).json({
      message: "Photo created successfully",
      photo,
    });
  } catch (error) {
    if (isPrismaForeignKeyError(error)) {
      res.status(400).json({
        message: "Invalid related record id",
      });
      return;
    }

    console.error("Create photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updatePhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const photoId = parsePositiveInt(req.params.id);

    if (!photoId) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const parsed = updatePhotoSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const body = parsed.data as UpdatePhotoBody;

    const photo = await getPhotoForEdit(photoId);

    if (!photo) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    const isOwner = photo.author_id === req.user.userId;

    const ownerCanEdit =
      isOwner &&
      (photo.status === ReviewStatus.Ootel ||
        photo.status === ReviewStatus.Tagasi_lukatud);

    if (!isHigherRole(req) && !ownerCanEdit) {
      res.status(403).json({ message: "You cannot edit this photo" });
      return;
    }

    const updatedPhoto = await updatePhoto(photoId, body);

    if (!updatedPhoto) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    res.status(200).json({
      message: "Photo updated successfully",
      photo: updatedPhoto,
    });
  } catch (error) {
    if (isPrismaForeignKeyError(error)) {
      res.status(400).json({
        message: "Invalid related record id",
      });
      return;
    }

    console.error("Update photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deletePhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const photoId = parsePositiveInt(req.params.id);

    if (!photoId) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const photo = await getPhotoForEdit(photoId);

    if (!photo) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    const isOwner = photo.author_id === req.user.userId;

    const ownerCanDelete =
      isOwner &&
      (photo.status === ReviewStatus.Ootel ||
        photo.status === ReviewStatus.Tagasi_lukatud);

    if (!isHigherRole(req) && !ownerCanDelete) {
      res.status(403).json({ message: "You cannot delete this photo" });
      return;
    }

    const deletedPhoto = await deletePhoto(photoId);

    if (!deletedPhoto) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    res.status(200).json({
      message: "Photo deleted successfully",
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    console.error("Delete photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPendingPhotosHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = Math.max(Number(getSingleString(req.query.page)) || 1, 1);

    const limit = Math.min(
      Math.max(Number(getSingleString(req.query.limit)) || 10, 1),
      50
    );

    const result = await getPendingPhotos({ page, limit });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get pending photos error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function approvePhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const photoId = parsePositiveInt(req.params.id);

    if (!photoId) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const photo = await approvePhoto(photoId);

    res.status(200).json({
      message: "Photo approved successfully",
      photo,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    console.error("Approve photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function rejectPhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const photoId = parsePositiveInt(req.params.id);

    if (!photoId) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const parsed = rejectSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const photo = await rejectPhoto(photoId, parsed.data.review_comment);

    res.status(200).json({
      message: "Photo rejected successfully",
      photo,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    console.error("Reject photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}