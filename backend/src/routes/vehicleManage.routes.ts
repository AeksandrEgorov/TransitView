import { Router } from "express";
import {
  getManageVehicleHandler,
  getManageVehiclesHandler,
} from "../controllers/vehicleManage.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("Andmebaasi_toimetaja", "Administraator"));

router.get("/", getManageVehiclesHandler);

router.get("/:id", getManageVehicleHandler);

export default router;