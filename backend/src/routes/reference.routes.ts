// This file sets up reference routes.

import { Router } from "express";

import {
  getCategories,
  getCities,
  getCompanies,
  getCompanyBranches,
  getCounties,
  getManageFilters,
  getModels,
  getMyFilters,
  getPublicFilters,
} from "../controllers/reference.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.get("/public-filters", getPublicFilters);
router.get("/my-filters", requireAuth, getMyFilters);
router.get(
  "/manage-filters",
  requireAuth,
  requireRole("Andmebaasi_toimetaja", "Administraator"),
  getManageFilters
);

router.get("/counties", getCounties);
router.get("/cities", getCities);
router.get("/categories", getCategories);
router.get("/models", getModels);
router.get("/companies", getCompanies);
router.get("/company-branches", getCompanyBranches);

export default router;
