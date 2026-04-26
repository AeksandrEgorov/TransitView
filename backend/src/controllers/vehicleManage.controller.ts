import type { Response } from "express";
import type { AuthRequest } from "../types/auth.js";
import type { ManageVehicleListQuery } from "../types/vehicleManage.js";
import { ReviewStatus } from "../generated/prisma/client.js";
import {
  getManageVehicleById,
  getManageVehicles,
} from "../services/vehicleManage.service.js";

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

function parseReviewStatus(value: string | undefined): ReviewStatus | undefined | null {
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

  return null;
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

    const result = await getManageVehicles({
      page,
      limit,

      status,

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

    if (Number.isNaN(vehicleId)) {
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