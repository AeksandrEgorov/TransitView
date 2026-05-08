import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client.js";

import prisma from "../config/prisma.js";
import { dbView } from "../utils/dbView.js";

type PublicFilterCategoryRow = {
  category_id: number;
  name: string;
};

type PublicFilterCountyRow = {
  county_id: number;
  name: string;
};

type PublicFilterCityRow = {
  city_id: number;
  name: string;
  county_id: number;
  county_name: string;
};

type PublicFilterConditionRow = {
  condition: string;
};

function mapCity(row: PublicFilterCityRow) {
  return {
    city_id: row.city_id,
    name: row.name,
    county: {
      county_id: row.county_id,
      name: row.county_name,
    },
  };
}

async function getVehiclePublicFilters() {
  const [categories, counties, cities, conditions] = await Promise.all([
    prisma.$queryRaw<PublicFilterCategoryRow[]>`
      SELECT DISTINCT
        category_id,
        category_name AS name
      FROM ${Prisma.raw(dbView("v_public_vehicles"))}
      WHERE category_id IS NOT NULL
      ORDER BY name ASC
    `,

    prisma.$queryRaw<PublicFilterCountyRow[]>`
      SELECT DISTINCT
        county_id,
        county_name AS name
      FROM ${Prisma.raw(dbView("v_public_vehicle_photos"))}
      WHERE county_id IS NOT NULL
      ORDER BY name ASC
    `,

    prisma.$queryRaw<PublicFilterCityRow[]>`
      SELECT DISTINCT
        city_id,
        city_name AS name,
        county_id,
        county_name
      FROM ${Prisma.raw(dbView("v_public_vehicle_photos"))}
      WHERE city_id IS NOT NULL
      ORDER BY county_name ASC, name ASC
    `,

    prisma.$queryRaw<PublicFilterConditionRow[]>`
      SELECT DISTINCT
        condition
      FROM ${Prisma.raw(dbView("v_public_vehicles"))}
      WHERE condition IS NOT NULL
      ORDER BY condition ASC
    `,
  ]);

  return {
    categories,
    counties,
    cities: cities.map(mapCity),
    conditions: conditions.map((row) => row.condition),
  };
}

async function getPhotoPublicFilters() {
  const [categories, counties, cities, conditions] = await Promise.all([
    prisma.$queryRaw<PublicFilterCategoryRow[]>`
      SELECT DISTINCT
        category_id,
        category_name AS name
      FROM ${Prisma.raw(dbView("v_public_photos"))}
      WHERE category_id IS NOT NULL
      ORDER BY name ASC
    `,

    prisma.$queryRaw<PublicFilterCountyRow[]>`
      SELECT DISTINCT
        county_id,
        county_name AS name
      FROM ${Prisma.raw(dbView("v_public_photos"))}
      WHERE county_id IS NOT NULL
      ORDER BY name ASC
    `,

    prisma.$queryRaw<PublicFilterCityRow[]>`
      SELECT DISTINCT
        city_id,
        city_name AS name,
        county_id,
        county_name
      FROM ${Prisma.raw(dbView("v_public_photos"))}
      WHERE city_id IS NOT NULL
      ORDER BY county_name ASC, name ASC
    `,

    prisma.$queryRaw<PublicFilterConditionRow[]>`
      SELECT DISTINCT
        vehicle_condition AS condition
      FROM ${Prisma.raw(dbView("v_public_photos"))}
      WHERE vehicle_condition IS NOT NULL
      ORDER BY condition ASC
    `,
  ]);

  return {
    categories,
    counties,
    cities: cities.map(mapCity),
    conditions: conditions.map((row) => row.condition),
  };
}

export async function getPublicFilters(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const [vehicleFilters, photoFilters] = await Promise.all([
      getVehiclePublicFilters(),
      getPhotoPublicFilters(),
    ]);

    res.status(200).json({
      vehicleFilters,
      photoFilters,
    });
  } catch (error) {
    console.error("Get public filters error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCounties(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const counties = await prisma.counties.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json(counties);
  } catch (error) {
    console.error("Get counties error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCities(req: Request, res: Response): Promise<void> {
  try {
    const countyId = req.query.countyId
      ? Number(req.query.countyId)
      : undefined;

    const cities = await prisma.cities.findMany({
      where: countyId ? { county_id: countyId } : undefined,
      orderBy: {
        name: "asc",
      },
      include: {
        county: true,
      },
    });

    res.status(200).json(cities);
  } catch (error) {
    console.error("Get cities error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCategories(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getModels(req: Request, res: Response): Promise<void> {
  try {
    const categoryId = req.query.categoryId
      ? Number(req.query.categoryId)
      : undefined;

    const models = await prisma.models.findMany({
      where: categoryId ? { category_id: categoryId } : undefined,
      orderBy: [
        {
          manufacturer: "asc",
        },
        {
          name: "asc",
        },
      ],
      include: {
        category: true,
      },
    });

    res.status(200).json(models);
  } catch (error) {
    console.error("Get models error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCompanies(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const companies = await prisma.companies.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        city: {
          include: {
            county: true,
          },
        },
      },
    });

    res.status(200).json(companies);
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCompanyBranches(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined;

    const cityId = req.query.cityId ? Number(req.query.cityId) : undefined;

    const branches = await prisma.company_branches.findMany({
      where: {
        ...(companyId ? { company_id: companyId } : {}),
        ...(cityId ? { city_id: cityId } : {}),
      },
      orderBy: {
        branch_name: "asc",
      },
      include: {
        company: true,
        city: {
          include: {
            county: true,
          },
        },
      },
    });

    res.status(200).json(branches);
  } catch (error) {
    console.error("Get company branches error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}