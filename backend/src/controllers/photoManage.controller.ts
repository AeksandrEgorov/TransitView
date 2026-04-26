import type { Response } from "express";
import type { AuthRequest } from "../types/auth.js";
import type { ManagePhotoListQuery } from "../types/photoManage.js";
import { ReviewStatus } from "../generated/prisma/client.js";
import {
  getManagePhotoById,
  getManagePhotos,
} from "../services/photoManage.service.js";

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
  if (value === ReviewStatus.Tagasi_lukatud) return ReviewStatus.Tagasi_lukatud;

  return null;
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

      cityId: query.cityId ? Number(query.cityId) : undefined,
      countyId: query.countyId ? Number(query.countyId) : undefined,
      vehicleId: query.vehicleId ? Number(query.vehicleId) : undefined,
      authorId: query.authorId ? Number(query.authorId) : undefined,

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

    if (Number.isNaN(photoId)) {
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