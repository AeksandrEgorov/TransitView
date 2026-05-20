// This controller returns public, personal, and manage dashboard stats.
// It keeps role checks close to the request before calling the stats service.

import type { Response } from "express";
import type { AuthRequest } from "../types/auth.js";
import {
  getManageStats,
  getMyStats,
  getPublicStats,
} from "../services/stats.service.js";

export async function getPublicStatsHandler(
  _req: AuthRequest,
  res: Response
) {
  try {
    const stats = await getPublicStats();

    res.status(200).json(stats);
  } catch (error) {
    console.error("Get public stats error:", error);
    res.status(500).json({ message: "Statistika laadimine ebaõnnestus" });
  }
}

export async function getMyStatsHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Sisselogimine on vajalik" });
      return;
    }

    const stats = await getMyStats(req.user.userId);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Get my stats error:", error);
    res.status(500).json({ message: "Minu statistika laadimine ebaõnnestus" });
  }
}

export async function getManageStatsHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Sisselogimine on vajalik" });
      return;
    }

    const stats = await getManageStats();

    res.status(200).json(stats);
  } catch (error) {
    console.error("Get manage stats error:", error);
    res
      .status(500)
      .json({ message: "Haldusstatistika laadimine ebaõnnestus" });
  }
}
