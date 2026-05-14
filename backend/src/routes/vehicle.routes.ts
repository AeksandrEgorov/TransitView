// This file sets up vehicle routes.

import { Router } from "express";

import {
  createVehicleHandler,
  deleteVehicleHandler,
  getMyVehicleHandler,
  getMyVehiclesHandler,
  getPendingVehiclesHandler,
  getVehicle,
  getVehicles,
  updateVehicleHandler,
} from "../controllers/vehicle.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import upload from "../config/multer.js";

const router = Router();

router.get("/", getVehicles);

router.get("/my", requireAuth, getMyVehiclesHandler);
router.get("/my/:id", requireAuth, getMyVehicleHandler);

router.get(
  "/pending",
  requireAuth,
  requireRole("Andmebaasi_toimetaja", "Administraator"),
  getPendingVehiclesHandler
);

router.get("/:id", getVehicle);

router.post("/", requireAuth, upload.single("image"), createVehicleHandler);
router.patch("/:id", requireAuth, updateVehicleHandler);
router.delete("/:id", requireAuth, deleteVehicleHandler);

export default router;