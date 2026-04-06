import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

export async function getCounties(_req: Request, res: Response): Promise<void> {
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
    const countyId = req.query.countyId ? Number(req.query.countyId) : undefined;

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

export async function getCategories(_req: Request, res: Response): Promise<void> {
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

export async function getCompanies(_req: Request, res: Response): Promise<void> {
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