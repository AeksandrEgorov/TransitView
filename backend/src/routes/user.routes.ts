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
router.use(requireRole("Administraator"));

router.get("/", getUsersHandler);
router.get("/:id", getUserHandler);

router.post("/", createUserHandler);
router.patch("/:id", updateUserHandler);
router.delete("/:id", deleteUserHandler);

export default router;