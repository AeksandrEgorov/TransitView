import { Router } from "express";

import {
  getCategories,
  getCities,
  getCompanies,
  getCompanyBranches,
  getCounties,
  getModels,
  getPublicFilters,
} from "../controllers/reference.controller.js";

const router = Router();

router.get("/public-filters", getPublicFilters);

router.get("/counties", getCounties);
router.get("/cities", getCities);
router.get("/categories", getCategories);
router.get("/models", getModels);
router.get("/companies", getCompanies);
router.get("/company-branches", getCompanyBranches);

export default router;