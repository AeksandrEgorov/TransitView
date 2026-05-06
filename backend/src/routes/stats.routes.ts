import { Router } from "express";
import { getPublicStatsHandler } from "../controllers/stats.controller.js";

const router = Router();

router.get("/public", getPublicStatsHandler);

export default router;