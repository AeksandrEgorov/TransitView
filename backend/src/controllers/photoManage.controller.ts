import type { Response } from "express";

import type { AuthRequest } from "../types/auth.js";
import type { ManagePhotoListQuery } from "../types/photoManage.js";
import { ReviewStatus } from "../generated/prisma/client.js";
import {
  approveManagePhoto,
  deleteManagePhoto,
  getManagePhotoById,
  getManagePhotos,
  rejectManagePhoto,
  updateManagePhoto,
} from "../services/photoManage.service.js";
import {
  rejectSchema,
  updateManagePhotoSchema,
} from "../validators/moderation.validator.js";

function parseDateQuery(
  value: string | undefined,
  endOfDay = false
): Date | null | undefined {
  if (!value) {
    return undefined;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);

  const date = isDateOnly
    ? new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseReviewStatus(
  value: string | undefined
): ReviewStatus | undefined | null {
  if (!value) {
    return undefined;
  }

  if (value === ReviewStatus.Ootel) return ReviewStatus.Ootel;
  if (value === ReviewStatus.Kinnitatud) return ReviewStatus.Kinnitatud;
  if (value === ReviewStatus.Tagasi_lukatud) {
    return ReviewStatus.Tagasi_lukatud;
  }

  return null;
}

function parseOptionalPositiveInt(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

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

export async function getManagePhotosHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const query = req.query as ManagePhotoListQuery;

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);

    const status = parseReviewStatus(query.status);

    if (status === null) {
      res.status(400).json({
        message:
          "Invalid status. Allowed values: Ootel, Kinnitatud, Tagasi_lukatud",
      });
      return;
    }

    const cityId = parseOptionalPositiveInt(query.cityId);
    const countyId = parseOptionalPositiveInt(query.countyId);
    const vehicleId = parseOptionalPositiveInt(query.vehicleId);
    const authorId = parseOptionalPositiveInt(query.authorId);

    if (
      cityId === null ||
      countyId === null ||
      vehicleId === null ||
      authorId === null
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
      cityId,
      countyId,
      vehicleId,
      authorId,
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

    const photo = await approveManagePhoto(photoId);

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

    const photo = await rejectManagePhoto(photoId, parsed.data.review_comment);

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