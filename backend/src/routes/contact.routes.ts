// This file sets up contact routes.

import { Router } from "express";

import { sendContactMessageHandler } from "../controllers/contact.controller.js";

const router = Router();

router.post("/", sendContactMessageHandler);

export default router;
