import { Router } from "express";
import {
  uploadPhotoHandler,
  getPhotosHandler,
  getPhotoHandler,
  getVehiclePhotosHandler,
  getMyPhotosHandler,
  getMyPhotoHandler,
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

router.post(
  "/upload",
  requireAuth,
  upload.single("image"),
  uploadPhotoHandler
);

router.get("/", getPhotosHandler);

router.get("/my", requireAuth, getMyPhotosHandler);

router.get("/my/:id", requireAuth, getMyPhotoHandler);

router.get(
  "/pending",
  requireAuth,
  requireRole("Andmebaasi_toimetaja", "Administraator"),
  getPendingPhotosHandler
);

router.get("/vehicle/:vehicleId", getVehiclePhotosHandler);

router.get("/:id", getPhotoHandler);

router.post("/", requireAuth, createPhotoHandler);

router.patch(
  "/:id",
  requireAuth,
  upload.single("image"),
  updatePhotoHandler
);

router.delete("/:id", requireAuth, deletePhotoHandler);

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