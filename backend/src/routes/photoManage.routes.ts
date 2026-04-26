import { Router } from "express";
import {
  getManagePhotoHandler,
  getManagePhotosHandler,
} from "../controllers/photoManage.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("Andmebaasi_toimetaja", "Administraator"));

router.get("/", getManagePhotosHandler);

router.get("/:id", getManagePhotoHandler);

export default router;