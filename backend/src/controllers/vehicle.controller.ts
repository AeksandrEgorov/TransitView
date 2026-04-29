import type { Response } from "express";
import type { AuthRequest } from "../types/auth.js";
import type { MyVehicleListQuery, VehicleListQuery } from "../types/vehicle.js";
import { ReviewStatus } from "../generated/prisma/client.js";
import {
  getPublicVehicles,
  getMyVehicles,
  getMyVehicleById,
  getVehicleById,
  createVehicleWithFirstPhoto,
  getVehicleForEdit,
  updateVehicle,
  deleteVehicle,
  getPendingVehicles,
  approveVehicle,
  rejectVehicle,
} from "../services/vehicle.service.js";
import { uploadBufferToCloudinary } from "../utils/uploadToCloudinary.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../validators/vehicle.validator.js";
import { rejectSchema } from "../validators/moderation.validator.js";

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

export async function getVehicles(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const query = req.query as VehicleListQuery;

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);

    const createdFrom = parseDateQuery(query.createdFrom);
    const createdTo = parseDateQuery(query.createdTo, true);

    if (createdFrom === null) {
      res.status(400).json({
        message: "Invalid createdFrom date format",
      });
      return;
    }

    if (createdTo === null) {
      res.status(400).json({
        message: "Invalid createdTo date format",
      });
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
      regNumber: query.regNumber,

      cityId: query.cityId ? Number(query.cityId) : undefined,
      countyId: query.countyId ? Number(query.countyId) : undefined,
      categoryId: query.categoryId ? Number(query.categoryId) : undefined,
      modelId: query.modelId ? Number(query.modelId) : undefined,
      companyId: query.companyId ? Number(query.companyId) : undefined,
      branchId: query.branchId ? Number(query.branchId) : undefined,

      condition: query.condition,

      createdFrom,
      createdTo,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get vehicles error:", error);
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

    const query = req.query as MyVehicleListQuery;

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

    const result = await getMyVehicles({
      userId: req.user.userId,
      page,
      limit,
      status,
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

    const vehicleId = Number(req.params.id);

    if (Number.isNaN(vehicleId)) {
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

export async function getVehicle(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const vehicleId = Number(req.params.id);

    if (Number.isNaN(vehicleId)) {
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

    const vehicleId = Number(req.params.id);

    if (Number.isNaN(vehicleId)) {
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
    const isHigherRole =
      req.user.role === "Andmebaasi_toimetaja" ||
      req.user.role === "Administraator";

    const ownerCanEdit =
      isOwner &&
      (vehicle.status === ReviewStatus.Ootel ||
        vehicle.status === ReviewStatus.Tagasi_lukatud);

    if (!isHigherRole && !ownerCanEdit) {
      res.status(403).json({ message: "You cannot edit this vehicle" });
      return;
    }

    const updatedVehicle = await updateVehicle(vehicleId, parsed.data);

    res.status(200).json({
      message: "Vehicle updated successfully",
      vehicle: updatedVehicle,
    });
  } catch (error) {
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

    const vehicleId = Number(req.params.id);

    if (Number.isNaN(vehicleId)) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const vehicle = await getVehicleForEdit(vehicleId);

    if (!vehicle) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    const isOwner = vehicle.created_by === req.user.userId;
    const isHigherRole =
      req.user.role === "Andmebaasi_toimetaja" ||
      req.user.role === "Administraator";

    const ownerCanDelete =
      isOwner &&
      (vehicle.status === ReviewStatus.Ootel ||
        vehicle.status === ReviewStatus.Tagasi_lukatud);

    if (!isHigherRole && !ownerCanDelete) {
      res.status(403).json({ message: "You cannot delete this vehicle" });
      return;
    }

    await deleteVehicle(vehicleId);

    res.status(200).json({
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPendingVehiclesHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

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
    const vehicleId = Number(req.params.id);

    if (Number.isNaN(vehicleId)) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const vehicle = await approveVehicle(vehicleId, req.user!.userId);

    res.status(200).json({
      message: "Vehicle approved successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Approve vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function rejectVehicleHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const vehicleId = Number(req.params.id);

    if (Number.isNaN(vehicleId)) {
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
      req.user!.userId,
      parsed.data.review_comment
    );

    res.status(200).json({
      message: "Vehicle rejected successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Reject vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}