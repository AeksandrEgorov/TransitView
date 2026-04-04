import { Router } from "express";
import {
  getVehicles,
  getVehicle,
  createVehicleHandler,
  updateVehicleHandler,
  deleteVehicleHandler,
  getPendingVehiclesHandler,
  approveVehicleHandler,
  rejectVehicleHandler,
} from "../controllers/vehicle.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.get("/", getVehicles);

router.get(
  "/pending",
  requireAuth,
  requireRole("Andmebaasi_toimetaja", "Administraator"),
  getPendingVehiclesHandler
);

router.get("/:id", getVehicle);

router.post(
  "/",
  requireAuth,
  requireRole("Kasutaja", "Andmebaasi_toimetaja", "Administraator"),
  createVehicleHandler
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("Kasutaja", "Andmebaasi_toimetaja", "Administraator"),
  updateVehicleHandler
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("Kasutaja", "Andmebaasi_toimetaja", "Administraator"),
  deleteVehicleHandler
);

router.patch(
  "/:id/approve",
  requireAuth,
  requireRole("Andmebaasi_toimetaja", "Administraator"),
  approveVehicleHandler
);

router.patch(
  "/:id/reject",
  requireAuth,
  requireRole("Andmebaasi_toimetaja", "Administraator"),
  rejectVehicleHandler
);

export default router;