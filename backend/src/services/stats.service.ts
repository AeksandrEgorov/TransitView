import prisma from "../config/prisma.js";
import { dbView } from "../utils/dbView.js";

type PublicStatsRow = {
  vehicles_total: number;
  photos_total: number;
  categories_total: number;
  cities_total: number;
};

export async function getPublicStats() {
  const rows = await prisma.$queryRawUnsafe<PublicStatsRow[]>(
    `SELECT * FROM ${dbView("v_public_stats")}`
  );

  const stats = rows[0];

  return {
    vehiclesTotal: stats?.vehicles_total ?? 0,
    photosTotal: stats?.photos_total ?? 0,
    categoriesTotal: stats?.categories_total ?? 0,
    citiesTotal: stats?.cities_total ?? 0,
  };
}