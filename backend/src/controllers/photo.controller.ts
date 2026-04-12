import type { Response } from "express";
import type { AuthRequest } from "../types/auth.js";
import type {
  PhotoListQuery,
  UpdatePhotoBody,
} from "../types/photo.js";
import {
  getPublicPhotos,
  getPhotoById,
  getPhotosByVehicleId,
  createPhoto,
  getPhotoForEdit,
  updatePhoto,
  deletePhoto,
  getPendingPhotos,
  approvePhoto,
  rejectPhoto,
} from "../services/photo.service.js";
import { uploadBufferToCloudinary } from "../utils/uploadToCloudinary.js";
import prisma from "../config/prisma.js";
import {
  createPhotoSchema,
  updatePhotoSchema,
} from "../validators/photo.validator.js";
import { rejectSchema } from "../validators/moderation.validator.js";

export async function uploadPhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, "transitview");

    res.status(200).json({
      message: "Image uploaded successfully",
      file_path: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload photo error:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
}

export async function getPhotosHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const query = req.query as PhotoListQuery;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const result = await getPublicPhotos({
      page,
      limit,
      cityId: query.cityId ? Number(query.cityId) : undefined,
      vehicleId: query.vehicleId ? Number(query.vehicleId) : undefined,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get photos error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const photoId = Number(req.params.id);

    if (Number.isNaN(photoId)) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const photo = await getPhotoById(photoId);

    if (!photo) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    res.status(200).json(photo);
  } catch (error) {
    console.error("Get photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getVehiclePhotosHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const vehicleId = Number(req.params.vehicleId);
    const query = req.query as PhotoListQuery;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    if (Number.isNaN(vehicleId)) {
      res.status(400).json({ message: "Invalid vehicle id" });
      return;
    }

    const result = await getPhotosByVehicleId({
      vehicleId,
      page,
      limit,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get vehicle photos error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createPhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const parsed = createPhotoSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const body = parsed.data;

    const vehicle = await prisma.vehicles.findUnique({
      where: {
        vehicle_id: body.vehicle_id,
      },
    });

    if (!vehicle) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    const isOwner = vehicle.created_by === req.user.userId;
    const isHigherRole =
      req.user.role === "Andmebaasi_toimetaja" ||
      req.user.role === "Administraator";

    if (!isOwner && !isHigherRole) {
      res.status(403).json({
        message: "You cannot add a photo to this vehicle",
      });
      return;
    }

    const photo = await createPhoto({
      vehicle_id: body.vehicle_id,
      city_id: body.city_id,
      place: body.place,
      taken_at: body.taken_at,
      file_path: body.file_path,
      user_id: req.user.userId,
    });

    res.status(201).json({
      message: "Photo created successfully",
      photo,
    });
  } catch (error) {
    console.error("Create photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updatePhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const photoId = Number(req.params.id);

    if (Number.isNaN(photoId)) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const parsed = updatePhotoSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const body = parsed.data as UpdatePhotoBody;

    const photo = await getPhotoForEdit(photoId);

    if (!photo) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    const isOwner = photo.author_id === req.user.userId;
    const isHigherRole =
      req.user.role === "Andmebaasi_toimetaja" ||
      req.user.role === "Administraator";

    const ownerCanEdit =
      isOwner &&
      (photo.status === "Ootel" || photo.status === "Tagasi_lukatud");

    if (!isHigherRole && !ownerCanEdit) {
      res.status(403).json({ message: "You cannot edit this photo" });
      return;
    }

    const updatedPhoto = await updatePhoto(photoId, body);

    res.status(200).json({
      message: "Photo updated successfully",
      photo: updatedPhoto,
    });
  } catch (error) {
    console.error("Update photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deletePhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const photoId = Number(req.params.id);

    if (Number.isNaN(photoId)) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const photo = await getPhotoForEdit(photoId);

    if (!photo) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    const isOwner = photo.author_id === req.user.userId;
    const isHigherRole =
      req.user.role === "Andmebaasi_toimetaja" ||
      req.user.role === "Administraator";

    const ownerCanDelete =
      isOwner &&
      (photo.status === "Ootel" || photo.status === "Tagasi_lukatud");

    if (!isHigherRole && !ownerCanDelete) {
      res.status(403).json({ message: "You cannot delete this photo" });
      return;
    }

    await deletePhoto(photoId);

    res.status(200).json({
      message: "Photo deleted successfully",
    });
  } catch (error) {
    console.error("Delete photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPendingPhotosHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const query = req.query as PhotoListQuery;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const result = await getPendingPhotos({ page, limit });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get pending photos error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function approvePhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const photoId = Number(req.params.id);

    if (Number.isNaN(photoId)) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const photo = await approvePhoto(photoId);

    res.status(200).json({
      message: "Photo approved successfully",
      photo,
    });
  } catch (error) {
    console.error("Approve photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function rejectPhotoHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const photoId = Number(req.params.id);

    if (Number.isNaN(photoId)) {
      res.status(400).json({ message: "Invalid photo id" });
      return;
    }

    const parsed = rejectSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const photo = await rejectPhoto(photoId, parsed.data.review_comment);

    res.status(200).json({
      message: "Photo rejected successfully",
      photo,
    });
  } catch (error) {
    console.error("Reject photo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}