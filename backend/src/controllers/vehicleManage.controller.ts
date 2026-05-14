// This controller handles editor/admin vehicle moderation endpoints.
// It reads manage filters, opens vehicle detail data, and moves vehicles between review statuses.

import type { NextFunction, Request, Response } from "express";

import {
  ReviewStatus,
  type VehicleCondition,
} from "../generated/prisma/client.js";
import {
  approveManageVehicle,
  getManageVehicleById,
  getManageVehicles,
  pendingManageVehicle,
  rejectManageVehicle,
} from "../services/vehicleManage.service.js";

type AuthenticatedRequest = Request & {
  user?: {
    user_id?: number;
    id?: number;
    userId?: number;
  };
};

function parseNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function parsePositiveNumber(value: unknown, fallback: number) {
  const parsed = parseNumber(value);

  if (!parsed || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parseDate(value: unknown, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function parseReviewStatus(value: unknown) {
  if (!value) {
    return undefined;
  }

  if (value === ReviewStatus.Ootel) {
    return ReviewStatus.Ootel;
  }

  if (value === ReviewStatus.Kinnitatud) {
    return ReviewStatus.Kinnitatud;
  }

  if (value === ReviewStatus.Tagasi_lukatud) {
    return ReviewStatus.Tagasi_lukatud;
  }

  return undefined;
}

function parseVehicleCondition(value: unknown) {
  if (!value) {
    return undefined;
  }

  return String(value) as VehicleCondition;
}

function getActorId(req: AuthenticatedRequest) {
  const actorId = Number(req.user?.user_id ?? req.user?.id ?? req.user?.userId);

  if (!Number.isFinite(actorId) || actorId < 1) {
    return null;
  }

  return actorId;
}

function isPrismaNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}

export async function getManageVehiclesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parsePositiveNumber(req.query.page, 1);
    const limit = parsePositiveNumber(req.query.limit, 10);

    const data = await getManageVehicles({
      page,
      limit,
      status: parseReviewStatus(req.query.status),
      regNumber: req.query.regNumber ? String(req.query.regNumber) : undefined,
      createdBy: parseNumber(req.query.createdBy),
      creatorId:
        parseNumber(req.query.creatorId) ??
        parseNumber(req.query.userId) ??
        parseNumber(req.query.created_by),
      cityId: parseNumber(req.query.cityId),
      countyId: parseNumber(req.query.countyId),
      categoryId: parseNumber(req.query.categoryId),
      modelId: parseNumber(req.query.modelId),
      companyId: parseNumber(req.query.companyId),
      branchId: parseNumber(req.query.branchId),
      condition: parseVehicleCondition(req.query.condition),
      createdFrom: parseDate(req.query.createdFrom),
      createdTo: parseDate(req.query.createdTo, true),
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getManageVehicleHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const vehicleId = Number(req.params.id);

    if (!Number.isFinite(vehicleId)) {
      res.status(400).json({
        message: "Invalid vehicle id",
      });
      return;
    }

    const vehicle = await getManageVehicleById(vehicleId);

    if (!vehicle) {
      res.status(404).json({
        message: "Vehicle not found",
      });
      return;
    }

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
}

export async function approveManageVehicleHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const vehicleId = Number(req.params.id);
    const actorId = getActorId(req);

    if (!Number.isFinite(vehicleId)) {
      res.status(400).json({
        message: "Invalid vehicle id",
      });
      return;
    }

    if (!actorId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    const vehicle = await approveManageVehicle(vehicleId, actorId);

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
}

export async function rejectManageVehicleHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const vehicleId = Number(req.params.id);
    const actorId = getActorId(req);
    const reviewComment =
      req.body.review_comment ?? req.body.reviewComment ?? req.body.comment;

    if (!Number.isFinite(vehicleId)) {
      res.status(400).json({
        message: "Invalid vehicle id",
      });
      return;
    }

    if (!actorId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    if (!reviewComment || !String(reviewComment).trim()) {
      res.status(400).json({
        message: "Reject comment is required",
      });
      return;
    }

    const vehicle = await rejectManageVehicle(
      vehicleId,
      actorId,
      String(reviewComment)
    );

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
}

export async function pendingManageVehicleHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const vehicleId = Number(req.params.id);

    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const vehicle = await pendingManageVehicle(vehicleId);

    res.status(200).json({
      message: "Vehicle moved to pending successfully",
      vehicle,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    console.error("Move vehicle to pending error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
