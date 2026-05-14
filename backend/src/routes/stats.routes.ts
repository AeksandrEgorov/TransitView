// This file sets up stats routes.

import { Router } from "express";
import {
  getManageStatsHandler,
  getMyStatsHandler,
  getPublicStatsHandler,
} from "../controllers/stats.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.get("/public", getPublicStatsHandler);

router.get("/my", requireAuth, getMyStatsHandler);

router.get(
  "/manage",
  requireAuth,
  requireRole("Andmebaasi_toimetaja", "Administraator"),
  getManageStatsHandler
);

export default router;