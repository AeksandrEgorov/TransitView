import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient, UserRole, ReviewStatus } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

import { counties } from "./data/counties.js";
import { cities } from "./data/cities.js";
import { categories } from "./data/categories.js";
import { models } from "./data/models.js";
import { companies } from "./data/companies.js";
import { companyBranches } from "./data/companyBranches.js";
import { users } from "./data/users.js";
import { vehicles } from "./data/vehicles.js";
import { photos } from "./data/photos.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  await prisma.photos.deleteMany();
  await prisma.vehicles.deleteMany();
  await prisma.company_branches.deleteMany();
  await prisma.companies.deleteMany();
  await prisma.models.deleteMany();
  await prisma.categories.deleteMany();
  await prisma.cities.deleteMany();
  await prisma.counties.deleteMany();
  await prisma.users.deleteMany();

  for (const county of counties) {
    await prisma.counties.create({ data: county });
  }

  for (const city of cities) {
    const county = await prisma.counties.findFirstOrThrow({
      where: { name: city.countyName },
    });

    await prisma.cities.create({
      data: {
        name: city.name,
        county_id: county.county_id,
      },
    });
  }

  for (const category of categories) {
    await prisma.categories.create({ data: category });
  }

  for (const model of models) {
    const category = await prisma.categories.findFirstOrThrow({
      where: { name: model.categoryName },
    });

    await prisma.models.create({
      data: {
        manufacturer: model.manufacturer,
        name: model.name,
        category_id: category.category_id,
      },
    });
  }

  for (const company of companies) {
    const city = await prisma.cities.findFirstOrThrow({
      where: { name: company.cityName },
    });

    await prisma.companies.create({
      data: {
        name: company.name,
        city_id: city.city_id,
      },
    });
  }

  for (const branch of companyBranches) {
    const company = await prisma.companies.findFirstOrThrow({
      where: { name: branch.companyName },
    });

    const city = await prisma.cities.findFirstOrThrow({
      where: { name: branch.cityName },
    });

    await prisma.company_branches.create({
      data: {
        company_id: company.company_id,
        city_id: city.city_id,
        branch_name: branch.branchName,
      },
    });
  }

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    await prisma.users.create({
      data: {
        username: user.username,
        password_hash: passwordHash,
        role: user.role as UserRole,
      },
    });
  }

  for (const vehicle of vehicles) {
    const model = await prisma.models.findFirstOrThrow({
      where: {
        manufacturer: vehicle.manufacturer,
        name: vehicle.modelName,
      },
    });

    const creator = await prisma.users.findFirstOrThrow({
      where: { username: vehicle.createdByUsername },
    });

    const reviewer = vehicle.reviewedByUsername
      ? await prisma.users.findFirstOrThrow({
          where: { username: vehicle.reviewedByUsername },
        })
      : null;

    const branch = vehicle.branchName
      ? await prisma.company_branches.findFirstOrThrow({
          where: { branch_name: vehicle.branchName },
        })
      : null;

    await prisma.vehicles.create({
      data: {
        reg_number: vehicle.regNumber,
        model_id: model.model_id,
        branch_id: branch?.branch_id ?? null,
        vla_year: vehicle.vlaYear,
        vin_code: vehicle.vinCode,
        chassis: vehicle.chassis,
        status: vehicle.status as ReviewStatus,
        created_by: creator.user_id,
        reviewed_by: reviewer?.user_id ?? null,
        reviewed_at: reviewer ? new Date() : null,
      },
    });
  }

  for (const photo of photos) {
    const vehicle = await prisma.vehicles.findFirstOrThrow({
      where: { reg_number: photo.regNumber },
    });

    const author = await prisma.users.findFirstOrThrow({
      where: { username: photo.authorUsername },
    });

    const city = await prisma.cities.findFirstOrThrow({
      where: { name: photo.cityName },
    });

    await prisma.photos.create({
      data: {
        vehicle_id: vehicle.vehicle_id,
        author_id: author.user_id,
        city_id: city.city_id,
        place: photo.place,
        taken_at: photo.takenAt,
        file_path: photo.filePath,
        status: photo.status as ReviewStatus,
        reviewed_at: photo.status === "Kinnitatud" ? new Date() : null,
      },
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });