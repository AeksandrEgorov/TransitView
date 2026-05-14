// This file sets up photo manage routes.

import { Router } from "express";

import {
  approveManagePhotoHandler,
  getManagePhotoHandler,
  getManagePhotosHandler,
  pendingManagePhotoHandler,
  rejectManagePhotoHandler,
} from "../controllers/photoManage.controller.js";

import {
  deletePhotoHandler,
  updatePhotoHandler,
} from "../controllers/photo.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import upload from "../config/multer.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("Andmebaasi_toimetaja", "Administraator"));

router.get("/", getManagePhotosHandler);
router.get("/:id", getManagePhotoHandler);

router.patch("/:id", upload.single("image"), updatePhotoHandler);
router.delete("/:id", deletePhotoHandler);

router.patch("/:id/approve", approveManagePhotoHandler);
router.patch("/:id/reject", rejectManagePhotoHandler);
router.patch("/:id/pending", pendingManagePhotoHandler);

export default router;