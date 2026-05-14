// This file sets up vehicle manage routes.

import { Router } from "express";

import {
  approveManageVehicleHandler,
  getManageVehicleHandler,
  getManageVehiclesHandler,
  pendingManageVehicleHandler,
  rejectManageVehicleHandler,
} from "../controllers/vehicleManage.controller.js";

import {
  deleteVehicleHandler,
  updateVehicleHandler,
} from "../controllers/vehicle.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("Andmebaasi_toimetaja", "Administraator"));

router.get("/", getManageVehiclesHandler);
router.get("/:id", getManageVehicleHandler);

router.patch("/:id", updateVehicleHandler);
router.delete("/:id", deleteVehicleHandler);

router.patch("/:id/approve", approveManageVehicleHandler);
router.patch("/:id/reject", rejectManageVehicleHandler);
router.patch("/:id/pending", pendingManageVehicleHandler);

export default router;