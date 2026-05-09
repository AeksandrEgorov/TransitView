import type { Response } from "express";

import type { AuthRequest } from "../types/auth.js";
import {
  ReviewStatus,
  VehicleCondition,
} from "../generated/prisma/client.js";

import {
  approveVehicle,
  createVehicleWithFirstPhoto,
  deleteVehicle,
  getMyVehicleById,
  getMyVehicles,
  getPendingVehicles,
  getPublicVehicles,
  getVehicleById,
  getVehicleForEdit,
  rejectVehicle,
  updateVehicle,
} from "../services/vehicle.service.js";

import { uploadBufferToCloudinary } from "../utils/uploadToCloudinary.js";

import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../validators/vehicle.validator.js";
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

function isHigherRole(req: AuthRequest) {
  return (
    req.user?.role === "Andmebaasi_toimetaja" ||
    req.user?.role === "Administraator"
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

function isPrismaNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}

function isProtectedVehicleError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("Kinnitatud sõidukit ei saa muuta") ||
      error.message.includes("Kinnitatud sõidukit ei saa kustutada"))
  );
}

export async function getVehicles(
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
    const categoryId = parseOptionalPositiveInt(req.query.categoryId);
    const modelId = parseOptionalPositiveInt(req.query.modelId);
    const companyId = parseOptionalPositiveInt(req.query.companyId);
    const branchId = parseOptionalPositiveInt(req.query.branchId);

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

    const result = await getPublicVehicles({
      page,
      limit,
      regNumber: getSingleString(req.query.regNumber)?.trim() || undefined,
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
    console.error("Get vehicles error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getVehicle(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const vehicleId = parsePositiveInt(req.params.id);

    if (!vehicleId) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const vehicle = await getVehicleById(vehicleId);

    if (!vehicle) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Get vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyVehiclesHandler(
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
        message: "Invalid status. Allowed values: Ootel, Kinnitatud, Tagasi_lukatud",
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

    const result = await getMyVehicles({
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
    console.error("Get my vehicles error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyVehicleHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const vehicleId = parsePositiveInt(req.params.id);

    if (!vehicleId) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const vehicle = await getMyVehicleById(vehicleId, req.user.userId);

    if (!vehicle) {
      res.status(404).json({
        message: "Vehicle not found or you do not have access to it",
      });
      return;
    }

    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Get my vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createVehicleHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        message: "At least one image is required to create a vehicle card",
      });
      return;
    }

    const parsed = createVehicleSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      model_id,
      branch_id,
      reg_number,
      vla_year,
      vin_code,
      chassis,
      condition,
      city_id,
      place,
      taken_at,
    } = parsed.data;

    const uploadedImage = await uploadBufferToCloudinary(
      req.file.buffer,
      "transitview"
    );

    const result = await createVehicleWithFirstPhoto({
      model_id,
      branch_id,
      reg_number,
      vla_year,
      vin_code,
      chassis,
      condition,
      city_id,
      place,
      taken_at,
      file_path: uploadedImage.secure_url,
      cloudinary_public_id: uploadedImage.public_id,
      user_id: req.user.userId,
    });

    res.status(201).json({
      message: "Vehicle card created successfully with first photo",
      ...result,
    });
  } catch (error) {
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

    console.error("Create vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateVehicleHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const vehicleId = parsePositiveInt(req.params.id);

    if (!vehicleId) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const parsed = updateVehicleSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const vehicle = await getVehicleForEdit(vehicleId);

    if (!vehicle) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    const isOwner = vehicle.created_by === req.user.userId;

    const ownerCanEdit =
      isOwner &&
      (vehicle.status === ReviewStatus.Ootel ||
        vehicle.status === ReviewStatus.Tagasi_lukatud);

    if (!isHigherRole(req) && !ownerCanEdit) {
      res.status(403).json({ message: "You cannot edit this vehicle" });
      return;
    }

    const updatedVehicle = await updateVehicle(vehicleId, parsed.data);

    if (!updatedVehicle) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    res.status(200).json({
      message: "Vehicle updated successfully",
      vehicle: updatedVehicle,
    });
  } catch (error) {
    if (isProtectedVehicleError(error)) {
      res.status(403).json({
        message: error instanceof Error ? error.message : "Forbidden",
      });
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

    console.error("Update vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteVehicleHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const vehicleId = parsePositiveInt(req.params.id);

    if (!vehicleId) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const vehicle = await getVehicleForEdit(vehicleId);

    if (!vehicle) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    const isOwner = vehicle.created_by === req.user.userId;

    const ownerCanDelete =
      isOwner &&
      (vehicle.status === ReviewStatus.Ootel ||
        vehicle.status === ReviewStatus.Tagasi_lukatud);

    if (!isHigherRole(req) && !ownerCanDelete) {
      res.status(403).json({ message: "You cannot delete this vehicle" });
      return;
    }

    const deletedVehicle = await deleteVehicle(vehicleId);

    if (!deletedVehicle) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    res.status(200).json({
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    if (isProtectedVehicleError(error)) {
      res.status(403).json({
        message: error instanceof Error ? error.message : "Forbidden",
      });
      return;
    }

    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    console.error("Delete vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPendingVehiclesHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = Math.max(Number(getSingleString(req.query.page)) || 1, 1);
    const limit = Math.min(
      Math.max(Number(getSingleString(req.query.limit)) || 10, 1),
      50
    );

    const result = await getPendingVehicles({ page, limit });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get pending vehicles error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function approveVehicleHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const vehicleId = parsePositiveInt(req.params.id);

    if (!vehicleId) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const vehicle = await approveVehicle(vehicleId, req.user.userId);

    res.status(200).json({
      message: "Vehicle approved successfully",
      vehicle,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    console.error("Approve vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function rejectVehicleHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const vehicleId = parsePositiveInt(req.params.id);

    if (!vehicleId) {
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

    const vehicle = await rejectVehicle(
      vehicleId,
      req.user.userId,
      parsed.data.review_comment
    );

    res.status(200).json({
      message: "Vehicle rejected successfully",
      vehicle,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    console.error("Reject vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}