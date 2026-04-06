import { Router } from "express";
import {
  getCounties,
  getCities,
  getCategories,
  getModels,
  getCompanies,
  getCompanyBranches,
} from "../controllers/reference.controller.js";

const router = Router();

router.get("/counties", getCounties);
router.get("/cities", getCities);
router.get("/categories", getCategories);
router.get("/models", getModels);
router.get("/companies", getCompanies);
router.get("/company-branches", getCompanyBranches);

export default router;