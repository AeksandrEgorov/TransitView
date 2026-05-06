import prisma from "../config/prisma.js";
import { ReviewStatus } from "../generated/prisma/client.js";

export async function getPublicStats() {
  const confirmedVehicleWhere = {
    status: ReviewStatus.Kinnitatud,
  };

  const confirmedPhotoWhere = {
    status: ReviewStatus.Kinnitatud,
    vehicle: {
      status: ReviewStatus.Kinnitatud,
    },
  };

  const [
    vehiclesTotal,
    photosTotal,
    vehiclesWithCategory,
    photosWithCity,
  ] = await Promise.all([
    prisma.vehicles.count({
      where: confirmedVehicleWhere,
    }),

    prisma.photos.count({
      where: confirmedPhotoWhere,
    }),

    prisma.vehicles.findMany({
      where: confirmedVehicleWhere,
      select: {
        model: {
          select: {
            category_id: true,
          },
        },
      },
    }),

    prisma.photos.findMany({
      where: {
        ...confirmedPhotoWhere,
        city_id: {
          not: null,
        },
      },
      select: {
        city_id: true,
      },
      distinct: ["city_id"],
    }),
  ]);

  const categoriesTotal = new Set(
    vehiclesWithCategory.map((vehicle) => vehicle.model.category_id)
  ).size;

  return {
    vehiclesTotal,
    photosTotal,
    categoriesTotal,
    citiesTotal: photosWithCity.length,
  };
}