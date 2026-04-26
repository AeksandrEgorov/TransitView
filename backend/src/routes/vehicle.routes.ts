import { Router } from "express";
import {
  getVehicles,
  getMyVehiclesHandler,
  getMyVehicleHandler,
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
import upload  from "../config/multer.js";

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