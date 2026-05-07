import { Router } from "express";

import {
  approveManagePhotoHandler,
  deleteManagePhotoHandler,
  getManagePhotoHandler,
  getManagePhotosHandler,
  rejectManagePhotoHandler,
  updateManagePhotoHandler,
} from "../controllers/photoManage.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("Andmebaasi_toimetaja", "Administraator"));

router.get("/", getManagePhotosHandler);
router.get("/:id", getManagePhotoHandler);

router.patch("/:id", updateManagePhotoHandler);
router.delete("/:id", deleteManagePhotoHandler);

router.patch("/:id/approve", approveManagePhotoHandler);
router.patch("/:id/reject", rejectManagePhotoHandler);

export default router;