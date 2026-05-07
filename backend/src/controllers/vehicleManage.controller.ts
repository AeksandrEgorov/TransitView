import type { Response } from "express";

import type { AuthRequest } from "../types/auth.js";
import type { ManageVehicleListQuery } from "../types/vehicleManage.js";
import {
  ReviewStatus,
  VehicleCondition,
} from "../generated/prisma/client.js";
import {
  approveManageVehicle,
  deleteManageVehicle,
  getManageVehicleById,
  getManageVehicles,
  rejectManageVehicle,
  updateManageVehicle,
} from "../services/vehicleManage.service.js";
import {
  rejectSchema,
  updateManageVehicleSchema,
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

function parseVehicleCondition(
  value: string | undefined
): VehicleCondition | undefined | null {
  if (!value) {
    return undefined;
  }

  if (value === VehicleCondition.Töökorras) return VehicleCondition.Töökorras;
  if (value === VehicleCondition.Ei_tööta) return VehicleCondition.Ei_tööta;
  if (value === VehicleCondition.Maha_kantud) {
    return VehicleCondition.Maha_kantud;
  }
  if (value === VehicleCondition.Müüdud) return VehicleCondition.Müüdud;
  if (value === VehicleCondition.Teadmata) return VehicleCondition.Teadmata;

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

function getAuthenticatedUserId(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return null;
  }

  return req.user.userId;
}

function isPrismaNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}

function isPrismaUniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
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

export async function getManageVehiclesHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const query = req.query as ManageVehicleListQuery;

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
    const categoryId = parseOptionalPositiveInt(query.categoryId);
    const modelId = parseOptionalPositiveInt(query.modelId);
    const companyId = parseOptionalPositiveInt(query.companyId);
    const branchId = parseOptionalPositiveInt(query.branchId);

    if (
      cityId === null ||
      countyId === null ||
      categoryId === null ||
      modelId === null ||
      companyId === null ||
      branchId === null
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

    const result = await getManageVehicles({
      page,
      limit,
      status,
      regNumber: query.regNumber?.trim() || undefined,
      cityId,
      countyId,
      categoryId,
      modelId,
      companyId,
      branchId,
      condition,
      createdFrom,
      createdTo,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get manage vehicles error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getManageVehicleHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const vehicleId = Number(req.params.id);

    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const vehicle = await getManageVehicleById(vehicleId);

    if (!vehicle) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Get manage vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateManageVehicleHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const actorId = getAuthenticatedUserId(req, res);

    if (!actorId) {
      return;
    }

    const vehicleId = Number(req.params.id);

    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const parsed = updateManageVehicleSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const vehicle = await updateManageVehicle(vehicleId, {
      ...parsed.data,
      actor_id: actorId,
    });

    res.status(200).json({
      message: "Vehicle updated successfully",
      vehicle,
    });
  } catch (error) {
    if (isRejectCommentError(error)) {
      res.status(400).json({
        message: "review_comment is required when rejecting vehicle",
      });
      return;
    }

    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    if (isPrismaUniqueError(error)) {
      res.status(409).json({
        message: "Vehicle with this registration number already exists",
      });
      return;
    }

    if (isPrismaForeignKeyError(error)) {
      res.status(400).json({
        message: "Invalid related record id",
      });
      return;
    }

    console.error("Update manage vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteManageVehicleHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const vehicleId = Number(req.params.id);

    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const deletedVehicle = await deleteManageVehicle(vehicleId);

    if (!deletedVehicle) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    res.status(200).json({
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete manage vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function approveManageVehicleHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const actorId = getAuthenticatedUserId(req, res);

    if (!actorId) {
      return;
    }

    const vehicleId = Number(req.params.id);

    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const vehicle = await approveManageVehicle(vehicleId, actorId);

    res.status(200).json({
      message: "Vehicle approved successfully",
      vehicle,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    console.error("Approve manage vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function rejectManageVehicleHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const actorId = getAuthenticatedUserId(req, res);

    if (!actorId) {
      return;
    }

    const vehicleId = Number(req.params.id);

    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      res.status(400).json({ message: "Invalid vehicle id" });
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

    const vehicle = await rejectManageVehicle(
      vehicleId,
      actorId,
      parsed.data.review_comment
    );

    res.status(200).json({
      message: "Vehicle rejected successfully",
      vehicle,
    });
  } catch (error) {
    if (isRejectCommentError(error)) {
      res.status(400).json({
        message: "review_comment is required when rejecting vehicle",
      });
      return;
    }

    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    console.error("Reject manage vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}