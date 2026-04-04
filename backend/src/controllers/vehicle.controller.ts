import type { Response } from "express";
import type { AuthRequest } from "../types/auth.js";
import type {
  VehicleListQuery,
  CreateVehicleBody,
  UpdateVehicleBody,
} from "../types/vehicle.js";
import {
  getPublicVehicles,
  getVehicleById,
  createVehicleWithFirstPhoto,
  getVehicleForEdit,
  updateVehicle,
  deleteVehicle,
  getPendingVehicles,
  approveVehicle,
  rejectVehicle,
} from "../services/vehicle.service.js";

export async function getVehicles(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const query = req.query as VehicleListQuery;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 12;

    const result = await getPublicVehicles({
      page,
      limit,
      regNumber: query.regNumber,
      cityId: query.cityId ? Number(query.cityId) : undefined,
      categoryId: query.categoryId ? Number(query.categoryId) : undefined,
      modelId: query.modelId ? Number(query.modelId) : undefined,
      companyId: query.companyId ? Number(query.companyId) : undefined,
      branchId: query.branchId ? Number(query.branchId) : undefined,
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

    const body = req.body as CreateVehicleBody;

    if (
      !body.model_id ||
      !body.reg_number ||
      !body.city_id ||
      !body.place ||
      !body.file_path
    ) {
      res.status(400).json({
        message:
          "model_id, reg_number, city_id, place and file_path are required",
      });
      return;
    }

    const result = await createVehicleWithFirstPhoto({
      model_id: Number(body.model_id),
      branch_id: body.branch_id ? Number(body.branch_id) : null,
      reg_number: body.reg_number,
      vla_year: body.vla_year ? Number(body.vla_year) : null,
      vin_code: body.vin_code ?? null,
      chassis: body.chassis ?? null,
      city_id: Number(body.city_id),
      place: body.place,
      taken_at: body.taken_at ?? null,
      file_path: body.file_path,
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

    const body = req.body as UpdateVehicleBody;

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
      (vehicle.status === "Ootel" || vehicle.status === "Tagasi_lukatud");

    if (!isHigherRole && !ownerCanEdit) {
      res.status(403).json({ message: "You cannot edit this vehicle" });
      return;
    }

    const updatedVehicle = await updateVehicle(vehicleId, body);

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
      (vehicle.status === "Ootel" || vehicle.status === "Tagasi_lukatud");

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
    const query = req.query as VehicleListQuery;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 12;

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

    const vehicleId = Number(req.params.id);

    if (Number.isNaN(vehicleId)) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const vehicle = await approveVehicle(vehicleId, req.user.userId);

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
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const vehicleId = Number(req.params.id);

    if (Number.isNaN(vehicleId)) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const vehicle = await rejectVehicle(vehicleId, req.user.userId);

    res.status(200).json({
      message: "Vehicle rejected successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Reject vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}