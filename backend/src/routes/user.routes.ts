import { Router } from "express";
import {
  getUsersHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("Administraator"),
  getUsersHandler
);

router.get(
  "/:id",
  requireAuth,
  requireRole("Administraator"),
  getUserHandler
);

router.post(
  "/",
  requireAuth,
  requireRole("Administraator"),
  createUserHandler
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("Administraator"),
  updateUserHandler
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("Administraator"),
  deleteUserHandler
);

export default router;