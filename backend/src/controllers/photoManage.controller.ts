import type { Response } from "express";

import type { AuthRequest } from "../types/auth.js";
import type { ManagePhotoListQuery } from "../types/photoManage.js";
import {
  ReviewStatus,
  VehicleCondition,
} from "../generated/prisma/client.js";
import {
  approveManagePhoto,
  deleteManagePhoto,
  getManagePhotoById,
  getManagePhotos,
  pendingManagePhoto,
  rejectManagePhoto,
  updateManagePhoto,
} from "../services/photoManage.service.js";
import {
  rejectSchema,
  updateManagePhotoSchema,
} from "../validators/moderation.validator.js";

function getSingleString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
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

function parseReviewStatus(value: unknown): ReviewStatus | undefined | null {
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

function parseOptionalPositiveInt(value: unknown) {
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

function isPrismaNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
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

function isRejectCommentError(error: unknown) {
  return error instanceof Error && error.message === "Reject comment is required";
}

function isProtectedPhotoError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Kinnitatud fotot ei saa kustutada")
  );
}

export async function getManagePhotosHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const query = req.query as ManagePhotoListQuery;

    const page = Math.max(Number(getSingleString(query.page)) || 1, 1);

    const limit = Math.min(
      Math.max(Number(getSingleString(query.limit)) || 10, 1),
      50
    );

    const status = parseReviewStatus(query.status);

    if (status === null) {
      res.status(400).json({
        message:
          "Invalid status. Allowed values: Ootel, Kinnitatud, Tagasi_lukatud",
      });
      return;
    }

    const condition = parseVehicleCondition(query.condition);

    if (condition === null) {
      res.status(400).json({
        message:
          "Invalid condition. Allowed values: Töökorras, Ei_tööta, Maha_kantud, Müüdud, Teadmata",
      });
      return;
    }

    const cityId = parseOptionalPositiveInt(query.cityId);
    const countyId = parseOptionalPositiveInt(query.countyId);
    const vehicleId = parseOptionalPositiveInt(query.vehicleId);
    const authorId = parseOptionalPositiveInt(query.authorId);
    const vehicleCreatorId = parseOptionalPositiveInt(query.vehicleCreatorId);
    const categoryId = parseOptionalPositiveInt(query.categoryId);

    if (
      cityId === null ||
      countyId === null ||
      vehicleId === null ||
      authorId === null ||
      vehicleCreatorId === null ||
      categoryId === null
    ) {
      res.status(400).json({ message: "Invalid numeric query parameter" });
      return;
    }

    const createdFrom = parseDateQuery(query.createdFrom);
    const createdTo = parseDateQuery(query.createdTo, true);

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

    const result = await getManagePhotos({
      page,
      limit,
      status,
      regNumber: getSingleString(query.regNumber)?.trim() || undefined,
      cityId,
      countyId,
      vehicleId,
      authorId,
      vehicleCreatorId,
      categoryId,
      condition,
      createdFrom,
      createdTo,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get manage photos error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getManagePhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const photoId = Number(req.params.id);

    if (!Number.isInteger(photoId) || photoId <= 0) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const photo = await getManagePhotoById(photoId);

    if (!photo) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    res.status(200).json(photo);
  } catch (error) {
    console.error("Get manage photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateManagePhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const photoId = Number(req.params.id);

    if (!Number.isInteger(photoId) || photoId <= 0) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const parsed = updateManagePhotoSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const photo = await updateManagePhoto(photoId, parsed.data);

    if (!photo) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    res.status(200).json({
      message: "Photo updated successfully",
      photo,
    });
  } catch (error) {
    if (isRejectCommentError(error)) {
      res.status(400).json({
        message: "review_comment is required when rejecting photo",
      });
      return;
    }

    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    if (isPrismaForeignKeyError(error)) {
      res.status(400).json({
        message: "Invalid related record id",
      });
      return;
    }

    console.error("Update manage photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteManagePhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const photoId = Number(req.params.id);

    if (!Number.isInteger(photoId) || photoId <= 0) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const deletedPhoto = await deleteManagePhoto(photoId);

    if (!deletedPhoto) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    res.status(200).json({
      message: "Photo deleted successfully",
    });
  } catch (error) {
    if (isProtectedPhotoError(error)) {
      res.status(403).json({
        message: error instanceof Error ? error.message : "Forbidden",
      });
      return;
    }

    console.error("Delete manage photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function approveManagePhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const photoId = Number(req.params.id);

    if (!Number.isInteger(photoId) || photoId <= 0) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const photo = await approveManagePhoto(photoId, req.user?.userId);

    res.status(200).json({
      message: "Photo approved successfully",
      photo,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    console.error("Approve manage photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function rejectManagePhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const photoId = Number(req.params.id);

    if (!Number.isInteger(photoId) || photoId <= 0) {
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

    const photo = await rejectManagePhoto(
      photoId,
      parsed.data.review_comment,
      req.user?.userId
    );

    res.status(200).json({
      message: "Photo rejected successfully",
      photo,
    });
  } catch (error) {
    if (isRejectCommentError(error)) {
      res.status(400).json({
        message: "review_comment is required when rejecting photo",
      });
      return;
    }

    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    console.error("Reject manage photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function pendingManagePhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const photoId = Number(req.params.id);

    if (!Number.isInteger(photoId) || photoId <= 0) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const photo = await pendingManagePhoto(photoId);

    if (!photo) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    res.status(200).json({
      message: "Photo moved to pending successfully",
      photo,
    });
  } catch (error) {
    console.error("Move photo to pending error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}