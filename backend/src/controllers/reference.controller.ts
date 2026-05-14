// This controller serves reference data for selects and filters.
// Public filters only show approved data, while my/manage filters include the data those pages need.

import type { Request, Response } from "express";

import prisma from "../config/prisma.js";
import { Prisma, ReviewStatus } from "../generated/prisma/client.js";
import { dbView } from "../utils/dbView.js";
import type { AuthRequest } from "../types/auth.js";

type CategoryRow = {
  category_id: number;
  name: string;
};

type CityRow = {
  city_id: number;
  name: string;
  county_id: number;
  county_name: string;
};

type ConditionRow = {
  condition: string;
};

function parseNumberParam(value: unknown) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? undefined : parsed;
}

function mapCityRows(rows: CityRow[]) {
  return rows.map((row) => ({
    city_id: row.city_id,
    name: row.name,
    county: {
      county_id: row.county_id,
      name: row.county_name,
    },
  }));
}

function buildCountiesFromCities(rows: CityRow[]) {
  const countyMap = new Map<number, { county_id: number; name: string }>();

  for (const row of rows) {
    if (!countyMap.has(row.county_id)) {
      countyMap.set(row.county_id, {
        county_id: row.county_id,
        name: row.county_name,
      });
    }
  }

  return Array.from(countyMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "et")
  );
}

function mapConditions(rows: ConditionRow[]) {
  return rows.map((row) => row.condition);
}

export async function getPublicFilters(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const vehicleCategories = await prisma.$queryRaw<CategoryRow[]>`
      SELECT DISTINCT
        v.category_id,
        v.category_name AS name
      FROM ${Prisma.raw(dbView("v_public_vehicles"))} v
      WHERE v.category_id IS NOT NULL
      ORDER BY name ASC
    `;

    const vehicleCityRows = await prisma.$queryRaw<CityRow[]>`
      SELECT DISTINCT
        location_rows.city_id,
        location_rows.name,
        location_rows.county_id,
        location_rows.county_name
      FROM (
        SELECT
          v.branch_city_id AS city_id,
          v.branch_city_name AS name,
          v.branch_county_id AS county_id,
          v.branch_county_name AS county_name
        FROM ${Prisma.raw(dbView("v_public_vehicles"))} v
        WHERE v.branch_city_id IS NOT NULL

        UNION

        SELECT
          p.city_id AS city_id,
          p.city_name AS name,
          p.county_id AS county_id,
          p.county_name AS county_name
        FROM ${Prisma.raw(dbView("v_public_vehicle_photos"))} p
        WHERE p.city_id IS NOT NULL
      ) location_rows
      ORDER BY location_rows.name ASC
    `;

    const vehicleConditionRows = await prisma.$queryRaw<ConditionRow[]>`
      SELECT DISTINCT
        v.condition::text AS condition
      FROM ${Prisma.raw(dbView("v_public_vehicles"))} v
      WHERE v.condition IS NOT NULL
      ORDER BY condition ASC
    `;

    const photoCategories = await prisma.$queryRaw<CategoryRow[]>`
      SELECT DISTINCT
        p.category_id,
        p.category_name AS name
      FROM ${Prisma.raw(dbView("v_public_photos"))} p
      WHERE p.category_id IS NOT NULL
      ORDER BY name ASC
    `;

    const photoCityRows = await prisma.$queryRaw<CityRow[]>`
      SELECT DISTINCT
        p.city_id,
        p.city_name AS name,
        p.county_id,
        p.county_name
      FROM ${Prisma.raw(dbView("v_public_photos"))} p
      WHERE p.city_id IS NOT NULL
      ORDER BY p.city_name ASC
    `;

    const photoConditionRows = await prisma.$queryRaw<ConditionRow[]>`
      SELECT DISTINCT
        p.vehicle_condition::text AS condition
      FROM ${Prisma.raw(dbView("v_public_photos"))} p
      WHERE p.vehicle_condition IS NOT NULL
      ORDER BY condition ASC
    `;

    res.status(200).json({
      vehicleFilters: {
        categories: vehicleCategories,
        counties: buildCountiesFromCities(vehicleCityRows),
        cities: mapCityRows(vehicleCityRows),
        conditions: mapConditions(vehicleConditionRows),
      },
      photoFilters: {
        categories: photoCategories,
        counties: buildCountiesFromCities(photoCityRows),
        cities: mapCityRows(photoCityRows),
        conditions: mapConditions(photoConditionRows),
      },
    });
  } catch (error) {
    console.error("Get public filters error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyFilters(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const userId = req.user.userId;

    const vehicleCategories = await prisma.$queryRaw<CategoryRow[]>`
      SELECT DISTINCT
        v.category_id,
        v.category_name AS name
      FROM ${Prisma.raw(dbView("v_my_vehicles"))} v
      WHERE v.created_by = ${userId}
        AND v.category_id IS NOT NULL
      ORDER BY name ASC
    `;

    const vehicleCityRows = await prisma.$queryRaw<CityRow[]>`
      SELECT DISTINCT
        p.city_id,
        p.city_name AS name,
        p.county_id,
        p.county_name
      FROM ${Prisma.raw(dbView("v_my_photos"))} p
      WHERE p.vehicle_created_by = ${userId}
        AND p.city_id IS NOT NULL
      ORDER BY p.city_name ASC
    `;

    const vehicleConditionRows = await prisma.$queryRaw<ConditionRow[]>`
      SELECT DISTINCT
        v.condition::text AS condition
      FROM ${Prisma.raw(dbView("v_my_vehicles"))} v
      WHERE v.created_by = ${userId}
        AND v.condition IS NOT NULL
      ORDER BY condition ASC
    `;

    const photoCategories = await prisma.$queryRaw<CategoryRow[]>`
      SELECT DISTINCT
        p.category_id,
        p.category_name AS name
      FROM ${Prisma.raw(dbView("v_my_photos"))} p
      WHERE p.author_id = ${userId}
        AND p.category_id IS NOT NULL
      ORDER BY name ASC
    `;

    const photoCityRows = await prisma.$queryRaw<CityRow[]>`
      SELECT DISTINCT
        p.city_id,
        p.city_name AS name,
        p.county_id,
        p.county_name
      FROM ${Prisma.raw(dbView("v_my_photos"))} p
      WHERE p.author_id = ${userId}
        AND p.city_id IS NOT NULL
      ORDER BY p.city_name ASC
    `;

    const photoConditionRows = await prisma.$queryRaw<ConditionRow[]>`
      SELECT DISTINCT
        p.vehicle_condition::text AS condition
      FROM ${Prisma.raw(dbView("v_my_photos"))} p
      WHERE p.author_id = ${userId}
        AND p.vehicle_condition IS NOT NULL
      ORDER BY condition ASC
    `;

    res.status(200).json({
      vehicleFilters: {
        categories: vehicleCategories,
        counties: buildCountiesFromCities(vehicleCityRows),
        cities: mapCityRows(vehicleCityRows),
        conditions: mapConditions(vehicleConditionRows),
      },
      photoFilters: {
        categories: photoCategories,
        counties: buildCountiesFromCities(photoCityRows),
        cities: mapCityRows(photoCityRows),
        conditions: mapConditions(photoConditionRows),
      },
    });
  } catch (error) {
    console.error("Get my filters error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getManageFilters(
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const vehicleCategories = await prisma.$queryRaw<CategoryRow[]>`
      SELECT DISTINCT
        v.category_id,
        v.category_name AS name
      FROM ${Prisma.raw(dbView("v_manage_vehicles"))} v
      WHERE v.category_id IS NOT NULL
      ORDER BY name ASC
    `;

    const vehicleCityRows = await prisma.$queryRaw<CityRow[]>`
      SELECT DISTINCT
        p.city_id,
        p.city_name AS name,
        p.county_id,
        p.county_name
      FROM ${Prisma.raw(dbView("v_manage_photos"))} p
      WHERE p.city_id IS NOT NULL
      ORDER BY p.city_name ASC
    `;

    const vehicleConditionRows = await prisma.$queryRaw<ConditionRow[]>`
      SELECT DISTINCT
        v.condition::text AS condition
      FROM ${Prisma.raw(dbView("v_manage_vehicles"))} v
      WHERE v.condition IS NOT NULL
      ORDER BY condition ASC
    `;

    const photoCategories = await prisma.$queryRaw<CategoryRow[]>`
      SELECT DISTINCT
        p.category_id,
        p.category_name AS name
      FROM ${Prisma.raw(dbView("v_manage_photos"))} p
      WHERE p.category_id IS NOT NULL
      ORDER BY name ASC
    `;

    const photoCityRows = await prisma.$queryRaw<CityRow[]>`
      SELECT DISTINCT
        p.city_id,
        p.city_name AS name,
        p.county_id,
        p.county_name
      FROM ${Prisma.raw(dbView("v_manage_photos"))} p
      WHERE p.city_id IS NOT NULL
      ORDER BY p.city_name ASC
    `;

    const photoConditionRows = await prisma.$queryRaw<ConditionRow[]>`
      SELECT DISTINCT
        p.vehicle_condition::text AS condition
      FROM ${Prisma.raw(dbView("v_manage_photos"))} p
      WHERE p.vehicle_condition IS NOT NULL
      ORDER BY condition ASC
    `;

    res.status(200).json({
      vehicleFilters: {
        categories: vehicleCategories,
        counties: buildCountiesFromCities(vehicleCityRows),
        cities: mapCityRows(vehicleCityRows),
        conditions: mapConditions(vehicleConditionRows),
      },
      photoFilters: {
        categories: photoCategories,
        counties: buildCountiesFromCities(photoCityRows),
        cities: mapCityRows(photoCityRows),
        conditions: mapConditions(photoConditionRows),
      },
    });
  } catch (error) {
    console.error("Get manage filters error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCounties(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const counties = await prisma.counties.findMany({
      where: {
        cities: {
          some: {
            status: ReviewStatus.Kinnitatud,
          },
        },
      },
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
    const countyId = parseNumberParam(req.query.countyId);

    const cities = await prisma.cities.findMany({
      where: {
        status: ReviewStatus.Kinnitatud,
        ...(countyId ? { county_id: countyId } : {}),
      },
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
      where: {
        models: {
          some: {
            status: ReviewStatus.Kinnitatud,
          },
        },
      },
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
    const categoryId = parseNumberParam(req.query.categoryId);

    const models = await prisma.models.findMany({
      where: {
        status: ReviewStatus.Kinnitatud,
        ...(categoryId ? { category_id: categoryId } : {}),
      },
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
      where: {
        status: ReviewStatus.Kinnitatud,
        OR: [
          {
            city_id: null,
          },
          {
            city: {
              status: ReviewStatus.Kinnitatud,
            },
          },
        ],
      },
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
    const companyId = parseNumberParam(req.query.companyId);
    const cityId = parseNumberParam(req.query.cityId);

    const branches = await prisma.company_branches.findMany({
      where: {
        status: ReviewStatus.Kinnitatud,
        company: {
          status: ReviewStatus.Kinnitatud,
        },
        city: {
          status: ReviewStatus.Kinnitatud,
        },
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
