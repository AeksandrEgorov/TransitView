import type { Request, Response } from "express";
import { getPublicStats } from "../services/stats.service.js";

export async function getPublicStatsHandler(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const stats = await getPublicStats();

    res.status(200).json(stats);
  } catch (error) {
    console.error("Get public stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}