import { Router } from "express";

import {
  createUserHandler,
  deleteUserHandler,
  getUserHandler,
  getUsersHandler,
  updateUserHandler,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("Andmebaasi_toimetaja", "Administraator"));

router.get("/", getUsersHandler);
router.get("/:id", getUserHandler);

router.post("/", requireRole("Administraator"), createUserHandler);
router.patch("/:id", requireRole("Administraator"), updateUserHandler);
router.delete("/:id", requireRole("Administraator"), deleteUserHandler);

export default router;