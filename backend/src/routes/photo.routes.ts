import { Router } from "express";
import {
  uploadPhotoHandler,
  getPhotosHandler,
  getPhotoHandler,
  getVehiclePhotosHandler,
  createPhotoHandler,
  updatePhotoHandler,
  deletePhotoHandler,
  getPendingPhotosHandler,
  approvePhotoHandler,
  rejectPhotoHandler,
} from "../controllers/photo.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import upload from "../config/multer.js";

const router = Router();

router.get("/", getPhotosHandler);

router.get(
  "/pending",
  requireAuth,
  requireRole("Andmebaasi_toimetaja", "Administraator"),
  getPendingPhotosHandler
);

router.get("/vehicle/:vehicleId", getVehiclePhotosHandler);

router.get("/:id", getPhotoHandler);


router.post(
  "/upload",
  requireAuth,
  requireRole("Kasutaja", "Andmebaasi_toimetaja", "Administraator"),
  upload.single("image"),
  uploadPhotoHandler
);

router.post(
  "/",
  requireAuth,
  requireRole("Kasutaja", "Andmebaasi_toimetaja", "Administraator"),
  createPhotoHandler
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("Kasutaja", "Andmebaasi_toimetaja", "Administraator"),
  updatePhotoHandler
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("Kasutaja", "Andmebaasi_toimetaja", "Administraator"),
  deletePhotoHandler
);

router.patch(
  "/:id/approve",
  requireAuth,
  requireRole("Andmebaasi_toimetaja", "Administraator"),
  approvePhotoHandler
);

router.patch(
  "/:id/reject",
  requireAuth,
  requireRole("Andmebaasi_toimetaja", "Administraator"),
  rejectPhotoHandler
);

export default router;