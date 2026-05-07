import { Router } from "express";

import {
  approveManageVehicleHandler,
  deleteManageVehicleHandler,
  getManageVehicleHandler,
  getManageVehiclesHandler,
  rejectManageVehicleHandler,
  updateManageVehicleHandler,
} from "../controllers/vehicleManage.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("Andmebaasi_toimetaja", "Administraator"));

router.get("/", getManageVehiclesHandler);
router.get("/:id", getManageVehicleHandler);

router.patch("/:id", updateManageVehicleHandler);
router.delete("/:id", deleteManageVehicleHandler);

router.patch("/:id/approve", approveManageVehicleHandler);
router.patch("/:id/reject", rejectManageVehicleHandler);

export default router;