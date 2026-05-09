import "dotenv/config";
import bcrypt from "bcrypt";
import {
  PrismaClient,
  ReviewStatus,
  UserRole,
  VehicleCondition,
} from "../src/generated/prisma/client.js";
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

const DB_SCHEMA = process.env.DB_SCHEMA ?? "transitview";

type DataRecord = Readonly<Record<string, any>>;

function table(name: string) {
  return `"${DB_SCHEMA}"."${name}"`;
}

function view(name: string) {
  return `"${DB_SCHEMA}"."${name}"`;
}

function enumValue(value: string) {
  return `'${value}'::"${DB_SCHEMA}"."ReviewStatus"`;
}

function key(...parts: Array<string | number | null | undefined>) {
  return parts.map((part) => String(part ?? "").trim().toLowerCase()).join("|");
}

function getValue<T = any>(
  row: DataRecord,
  keys: string[],
  fallback?: T
): T | undefined {
  for (const keyName of keys) {
    if (row[keyName] !== undefined && row[keyName] !== null) {
      return row[keyName] as T;
    }
  }

  return fallback;
}

function parseReviewStatus(value: unknown, fallback = ReviewStatus.Kinnitatud) {
  if (!value) {
    return fallback;
  }

  const text = String(value).trim();

  if (text === "Ootel") {
    return ReviewStatus.Ootel;
  }

  if (text === "Kinnitatud") {
    return ReviewStatus.Kinnitatud;
  }

  if (
    text === "Tagasi_lukatud" ||
    text === "Tagasi lükatud" ||
    text === "Tagasi_lükatud"
  ) {
    return ReviewStatus.Tagasi_lukatud;
  }

  return fallback;
}

function parseUserRole(value: unknown, fallback = UserRole.Kasutaja) {
  if (!value) {
    return fallback;
  }

  const text = String(value).trim();

  if (text === "Administraator") {
    return UserRole.Administraator;
  }

  if (text === "Andmebaasi_toimetaja") {
    return UserRole.Andmebaasi_toimetaja;
  }

  return UserRole.Kasutaja;
}

function parseVehicleCondition(
  value: unknown,
  fallback = VehicleCondition.Teadmata
) {
  if (!value) {
    return fallback;
  }

  const text = String(value).trim();

  if (text === "Töökorras") {
    return VehicleCondition.Töökorras;
  }

  if (text === "Ei_tööta" || text === "Ei tööta") {
    return VehicleCondition.Ei_tööta;
  }

  if (text === "Maha_kantud" || text === "Maha kantud") {
    return VehicleCondition.Maha_kantud;
  }

  if (text === "Müüdud") {
    return VehicleCondition.Müüdud;
  }

  return VehicleCondition.Teadmata;
}

function toDate(value: unknown) {
  if (!value) {
    return null;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

async function dropViews() {
  await prisma.$executeRawUnsafe(`
    DROP VIEW IF EXISTS ${view("v_public_stats")} CASCADE;
    DROP VIEW IF EXISTS ${view("v_admin_users")} CASCADE;
    DROP VIEW IF EXISTS ${view("v_moderation_queue")} CASCADE;
    DROP VIEW IF EXISTS ${view("v_manage_photos")} CASCADE;
    DROP VIEW IF EXISTS ${view("v_manage_vehicles")} CASCADE;
    DROP VIEW IF EXISTS ${view("v_my_photos")} CASCADE;
    DROP VIEW IF EXISTS ${view("v_my_vehicles")} CASCADE;
    DROP VIEW IF EXISTS ${view("v_public_vehicle_photos")} CASCADE;
    DROP VIEW IF EXISTS ${view("v_public_photos")} CASCADE;
    DROP VIEW IF EXISTS ${view("v_public_vehicles")} CASCADE;
  `);
}

async function truncateAllTables() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      ${table("Photos")},
      ${table("Vehicles")},
      ${table("Company_branches")},
      ${table("Companies")},
      ${table("Models")},
      ${table("Categories")},
      ${table("Cities")},
      ${table("Counties")},
      ${table("Users")}
    RESTART IDENTITY CASCADE;
  `);
}

async function createReviewFunction() {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION "${DB_SCHEMA}".set_reviewed_at()
    RETURNS trigger AS $$
    BEGIN
      IF NEW."status" IS DISTINCT FROM OLD."status" THEN
        IF NEW."status" IN (
          'Kinnitatud'::"${DB_SCHEMA}"."ReviewStatus",
          'Tagasi_lukatud'::"${DB_SCHEMA}"."ReviewStatus"
        ) THEN
          NEW."reviewed_at" := CURRENT_TIMESTAMP;
        END IF;

        IF NEW."status" = 'Ootel'::"${DB_SCHEMA}"."ReviewStatus" THEN
          NEW."reviewed_at" := NULL;
          NEW."reviewed_by" := NULL;
          NEW."review_comment" := NULL;
        END IF;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
}

async function createReviewTriggers() {
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS set_reviewed_at_on_vehicles ON ${table("Vehicles")};
    CREATE TRIGGER set_reviewed_at_on_vehicles
    BEFORE UPDATE ON ${table("Vehicles")}
    FOR EACH ROW
    EXECUTE FUNCTION "${DB_SCHEMA}".set_reviewed_at();

    DROP TRIGGER IF EXISTS set_reviewed_at_on_photos ON ${table("Photos")};
    CREATE TRIGGER set_reviewed_at_on_photos
    BEFORE UPDATE ON ${table("Photos")}
    FOR EACH ROW
    EXECUTE FUNCTION "${DB_SCHEMA}".set_reviewed_at();

    DROP TRIGGER IF EXISTS set_reviewed_at_on_cities ON ${table("Cities")};
    CREATE TRIGGER set_reviewed_at_on_cities
    BEFORE UPDATE ON ${table("Cities")}
    FOR EACH ROW
    EXECUTE FUNCTION "${DB_SCHEMA}".set_reviewed_at();

    DROP TRIGGER IF EXISTS set_reviewed_at_on_models ON ${table("Models")};
    CREATE TRIGGER set_reviewed_at_on_models
    BEFORE UPDATE ON ${table("Models")}
    FOR EACH ROW
    EXECUTE FUNCTION "${DB_SCHEMA}".set_reviewed_at();

    DROP TRIGGER IF EXISTS set_reviewed_at_on_companies ON ${table("Companies")};
    CREATE TRIGGER set_reviewed_at_on_companies
    BEFORE UPDATE ON ${table("Companies")}
    FOR EACH ROW
    EXECUTE FUNCTION "${DB_SCHEMA}".set_reviewed_at();

    DROP TRIGGER IF EXISTS set_reviewed_at_on_company_branches ON ${table(
      "Company_branches"
    )};
    CREATE TRIGGER set_reviewed_at_on_company_branches
    BEFORE UPDATE ON ${table("Company_branches")}
    FOR EACH ROW
    EXECUTE FUNCTION "${DB_SCHEMA}".set_reviewed_at();
  `);
}

async function createViews() {
  await prisma.$executeRawUnsafe(`
    CREATE VIEW ${view("v_public_vehicles")} AS
    SELECT
      v."vehicle_id",
      v."reg_number",
      v."vla_year",
      v."vin_code",
      v."chassis",
      v."condition",
      v."status",
      v."created_at",

      m."model_id",
      m."manufacturer",
      m."name" AS "model_name",
      m."status" AS "model_status",

      cat."category_id",
      cat."name" AS "category_name",

      cb."branch_id",
      cb."branch_name",
      cb."status" AS "branch_status",

      comp."company_id",
      comp."name" AS "company_name",
      comp."status" AS "company_status",

      branch_city."city_id" AS "branch_city_id",
      branch_city."name" AS "branch_city_name",
      branch_city."status" AS "branch_city_status",

      branch_county."county_id" AS "branch_county_id",
      branch_county."name" AS "branch_county_name",

      creator."user_id" AS "creator_id",
      creator."username" AS "creator_username",

      cover_photo."photo_id" AS "cover_photo_id",
      cover_photo."file_path" AS "cover_photo_url",
      cover_photo."cloudinary_public_id" AS "cover_photo_cloudinary_public_id",
      cover_photo."place" AS "cover_photo_place",
      cover_photo."taken_at" AS "cover_photo_taken_at",
      cover_photo."created_at" AS "cover_photo_created_at",

      cover_city."city_id" AS "cover_photo_city_id",
      cover_city."name" AS "cover_photo_city_name",

      cover_county."county_id" AS "cover_photo_county_id",
      cover_county."name" AS "cover_photo_county_name",

      (
        SELECT COUNT(*)::int
        FROM ${table("Photos")} p_count
        WHERE p_count."vehicle_id" = v."vehicle_id"
          AND p_count."status" = ${enumValue("Kinnitatud")}
      ) AS "confirmed_photos_count"

    FROM ${table("Vehicles")} v
    JOIN ${table("Models")} m
      ON m."model_id" = v."model_id"
    JOIN ${table("Categories")} cat
      ON cat."category_id" = m."category_id"
    LEFT JOIN ${table("Company_branches")} cb
      ON cb."branch_id" = v."branch_id"
    LEFT JOIN ${table("Companies")} comp
      ON comp."company_id" = cb."company_id"
    LEFT JOIN ${table("Cities")} branch_city
      ON branch_city."city_id" = cb."city_id"
    LEFT JOIN ${table("Counties")} branch_county
      ON branch_county."county_id" = branch_city."county_id"
    LEFT JOIN ${table("Users")} creator
      ON creator."user_id" = v."created_by"
    LEFT JOIN LATERAL (
      SELECT p.*
      FROM ${table("Photos")} p
      WHERE p."vehicle_id" = v."vehicle_id"
        AND p."status" = ${enumValue("Kinnitatud")}
      ORDER BY p."created_at" ASC, p."photo_id" ASC
      LIMIT 1
    ) cover_photo ON TRUE
    LEFT JOIN ${table("Cities")} cover_city
      ON cover_city."city_id" = cover_photo."city_id"
    LEFT JOIN ${table("Counties")} cover_county
      ON cover_county."county_id" = cover_city."county_id"
    WHERE v."status" = ${enumValue("Kinnitatud")}
      AND m."status" = ${enumValue("Kinnitatud")}
      AND (
        cb."branch_id" IS NULL
        OR cb."status" = ${enumValue("Kinnitatud")}
      )
      AND (
        comp."company_id" IS NULL
        OR comp."status" = ${enumValue("Kinnitatud")}
      )
      AND (
        branch_city."city_id" IS NULL
        OR branch_city."status" = ${enumValue("Kinnitatud")}
      );


    CREATE VIEW ${view("v_public_vehicle_photos")} AS
    SELECT
      p."photo_id",
      p."vehicle_id",
      p."author_id",
      p."city_id",
      p."place",
      p."taken_at",
      p."file_path",
      p."cloudinary_public_id",
      p."status",
      p."review_comment",
      p."reviewed_at",
      p."created_at",

      city."name" AS "city_name",
      city."status" AS "city_status",

      county."county_id",
      county."name" AS "county_name",

      author."username" AS "author_username",

      v."reg_number",
      v."condition" AS "vehicle_condition",
      v."status" AS "vehicle_status",

      m."model_id",
      m."manufacturer",
      m."name" AS "model_name",
      m."status" AS "model_status",

      cat."category_id",
      cat."name" AS "category_name"

    FROM ${table("Photos")} p
    JOIN ${table("Vehicles")} v
      ON v."vehicle_id" = p."vehicle_id"
    JOIN ${table("Models")} m
      ON m."model_id" = v."model_id"
    JOIN ${table("Categories")} cat
      ON cat."category_id" = m."category_id"
    LEFT JOIN ${table("Cities")} city
      ON city."city_id" = p."city_id"
    LEFT JOIN ${table("Counties")} county
      ON county."county_id" = city."county_id"
    LEFT JOIN ${table("Users")} author
      ON author."user_id" = p."author_id"
    LEFT JOIN ${table("Company_branches")} cb
      ON cb."branch_id" = v."branch_id"
    LEFT JOIN ${table("Companies")} comp
      ON comp."company_id" = cb."company_id"
    WHERE p."status" = ${enumValue("Kinnitatud")}
      AND v."status" = ${enumValue("Kinnitatud")}
      AND m."status" = ${enumValue("Kinnitatud")}
      AND (
        p."city_id" IS NULL
        OR city."status" = ${enumValue("Kinnitatud")}
      )
      AND (
        cb."branch_id" IS NULL
        OR cb."status" = ${enumValue("Kinnitatud")}
      )
      AND (
        comp."company_id" IS NULL
        OR comp."status" = ${enumValue("Kinnitatud")}
      );


    CREATE VIEW ${view("v_public_photos")} AS
    SELECT *
    FROM ${view("v_public_vehicle_photos")};


    CREATE VIEW ${view("v_my_vehicles")} AS
    SELECT
      v."vehicle_id",
      v."model_id",
      v."branch_id",
      v."reg_number",
      v."vla_year",
      v."vin_code",
      v."chassis",
      v."condition",
      v."status",
      v."review_comment",
      v."created_by",
      v."reviewed_by",
      v."reviewed_at",
      v."created_at",

      m."manufacturer",
      m."name" AS "model_name",
      m."status" AS "model_status",
      m."review_comment" AS "model_review_comment",

      cat."category_id",
      cat."name" AS "category_name",

      cb."branch_name",
      cb."status" AS "branch_status",
      cb."review_comment" AS "branch_review_comment",

      comp."name" AS "company_name",
      comp."status" AS "company_status",
      comp."review_comment" AS "company_review_comment",

      creator."username" AS "creator_username",
      reviewer."username" AS "reviewer_username",

      cover_photo."photo_id" AS "cover_photo_id",
      cover_photo."file_path" AS "cover_photo_url",
      cover_photo."cloudinary_public_id" AS "cover_photo_cloudinary_public_id",

      (
        SELECT COUNT(*)::int
        FROM ${table("Photos")} p_count
        WHERE p_count."vehicle_id" = v."vehicle_id"
      ) AS "photos_count"

    FROM ${table("Vehicles")} v
    JOIN ${table("Models")} m
      ON m."model_id" = v."model_id"
    JOIN ${table("Categories")} cat
      ON cat."category_id" = m."category_id"
    LEFT JOIN ${table("Company_branches")} cb
      ON cb."branch_id" = v."branch_id"
    LEFT JOIN ${table("Companies")} comp
      ON comp."company_id" = cb."company_id"
    LEFT JOIN ${table("Users")} creator
      ON creator."user_id" = v."created_by"
    LEFT JOIN ${table("Users")} reviewer
      ON reviewer."user_id" = v."reviewed_by"
    LEFT JOIN LATERAL (
      SELECT p.*
      FROM ${table("Photos")} p
      WHERE p."vehicle_id" = v."vehicle_id"
      ORDER BY p."created_at" ASC, p."photo_id" ASC
      LIMIT 1
    ) cover_photo ON TRUE;


    CREATE VIEW ${view("v_my_photos")} AS
    SELECT
      p."photo_id",
      p."vehicle_id",
      p."author_id",
      p."city_id",
      p."place",
      p."taken_at",
      p."file_path",
      p."cloudinary_public_id",
      p."status",
      p."review_comment",
      p."reviewed_by",
      p."reviewed_at",
      p."created_at",

      city."name" AS "city_name",
      city."status" AS "city_status",

      county."county_id",
      county."name" AS "county_name",

      author."username" AS "author_username",

      v."reg_number",
      v."condition" AS "vehicle_condition",
      v."status" AS "vehicle_status",
      v."created_by" AS "vehicle_created_by",

      m."model_id",
      m."manufacturer",
      m."name" AS "model_name",
      m."status" AS "model_status",

      cat."category_id",
      cat."name" AS "category_name"

    FROM ${table("Photos")} p
    JOIN ${table("Vehicles")} v
      ON v."vehicle_id" = p."vehicle_id"
    JOIN ${table("Models")} m
      ON m."model_id" = v."model_id"
    JOIN ${table("Categories")} cat
      ON cat."category_id" = m."category_id"
    LEFT JOIN ${table("Cities")} city
      ON city."city_id" = p."city_id"
    LEFT JOIN ${table("Counties")} county
      ON county."county_id" = city."county_id"
    LEFT JOIN ${table("Users")} author
      ON author."user_id" = p."author_id";


    CREATE VIEW ${view("v_manage_vehicles")} AS
    SELECT
      v.*,

      m."manufacturer",
      m."name" AS "model_name",
      m."status" AS "model_status",
      m."review_comment" AS "model_review_comment",

      cat."category_id",
      cat."name" AS "category_name",

      cb."branch_name",
      cb."status" AS "branch_status",
      cb."review_comment" AS "branch_review_comment",

      comp."name" AS "company_name",
      comp."status" AS "company_status",
      comp."review_comment" AS "company_review_comment",

      creator."username" AS "creator_username",
      reviewer."username" AS "reviewer_username",

      (
        SELECT COUNT(*)::int
        FROM ${table("Photos")} p_count
        WHERE p_count."vehicle_id" = v."vehicle_id"
      ) AS "photos_total",

      (
        SELECT COUNT(*)::int
        FROM ${table("Photos")} p_count
        WHERE p_count."vehicle_id" = v."vehicle_id"
          AND p_count."status" = ${enumValue("Ootel")}
      ) AS "photos_pending",

      (
        SELECT COUNT(*)::int
        FROM ${table("Photos")} p_count
        WHERE p_count."vehicle_id" = v."vehicle_id"
          AND p_count."status" = ${enumValue("Kinnitatud")}
      ) AS "photos_confirmed",

      (
        SELECT COUNT(*)::int
        FROM ${table("Photos")} p_count
        WHERE p_count."vehicle_id" = v."vehicle_id"
          AND p_count."status" = ${enumValue("Tagasi_lukatud")}
      ) AS "photos_rejected"

    FROM ${table("Vehicles")} v
    JOIN ${table("Models")} m
      ON m."model_id" = v."model_id"
    JOIN ${table("Categories")} cat
      ON cat."category_id" = m."category_id"
    LEFT JOIN ${table("Company_branches")} cb
      ON cb."branch_id" = v."branch_id"
    LEFT JOIN ${table("Companies")} comp
      ON comp."company_id" = cb."company_id"
    LEFT JOIN ${table("Users")} creator
      ON creator."user_id" = v."created_by"
    LEFT JOIN ${table("Users")} reviewer
      ON reviewer."user_id" = v."reviewed_by";


    CREATE VIEW ${view("v_manage_photos")} AS
    SELECT
      p.*,

      city."name" AS "city_name",
      city."status" AS "city_status",

      county."county_id",
      county."name" AS "county_name",

      author."username" AS "author_username",
      reviewer."username" AS "reviewer_username",

      v."reg_number",
      v."status" AS "vehicle_status",
      v."condition" AS "vehicle_condition",

      m."model_id",
      m."manufacturer",
      m."name" AS "model_name",
      m."status" AS "model_status",

      cat."category_id",
      cat."name" AS "category_name"

    FROM ${table("Photos")} p
    JOIN ${table("Vehicles")} v
      ON v."vehicle_id" = p."vehicle_id"
    JOIN ${table("Models")} m
      ON m."model_id" = v."model_id"
    JOIN ${table("Categories")} cat
      ON cat."category_id" = m."category_id"
    LEFT JOIN ${table("Cities")} city
      ON city."city_id" = p."city_id"
    LEFT JOIN ${table("Counties")} county
      ON county."county_id" = city."county_id"
    LEFT JOIN ${table("Users")} author
      ON author."user_id" = p."author_id"
    LEFT JOIN ${table("Users")} reviewer
      ON reviewer."user_id" = p."reviewed_by";


    CREATE VIEW ${view("v_moderation_queue")} AS
    SELECT
      'vehicle'::text AS "item_type",
      v."vehicle_id" AS "item_id",
      v."status",
      v."created_at",
      v."created_by",
      creator."username" AS "creator_username",
      v."reg_number" AS "title",
      CONCAT(m."manufacturer", ' ', m."name") AS "subtitle",
      v."review_comment"
    FROM ${table("Vehicles")} v
    JOIN ${table("Models")} m
      ON m."model_id" = v."model_id"
    LEFT JOIN ${table("Users")} creator
      ON creator."user_id" = v."created_by"
    WHERE v."status" = ${enumValue("Ootel")}

    UNION ALL

    SELECT
      'photo'::text AS "item_type",
      p."photo_id" AS "item_id",
      p."status",
      p."created_at",
      p."author_id" AS "created_by",
      author."username" AS "creator_username",
      CONCAT('Foto #', p."photo_id") AS "title",
      v."reg_number" AS "subtitle",
      p."review_comment"
    FROM ${table("Photos")} p
    JOIN ${table("Vehicles")} v
      ON v."vehicle_id" = p."vehicle_id"
    LEFT JOIN ${table("Users")} author
      ON author."user_id" = p."author_id"
    WHERE p."status" = ${enumValue("Ootel")};


    CREATE VIEW ${view("v_admin_users")} AS
    SELECT
      u."user_id",
      u."username",
      u."email",
      u."role",
      u."created_at",

      (
        SELECT COUNT(*)::int
        FROM ${table("Vehicles")} v
        WHERE v."created_by" = u."user_id"
      ) AS "vehicles_total",

      (
        SELECT COUNT(*)::int
        FROM ${table("Vehicles")} v
        WHERE v."created_by" = u."user_id"
          AND v."status" = ${enumValue("Ootel")}
      ) AS "vehicles_pending",

      (
        SELECT COUNT(*)::int
        FROM ${table("Vehicles")} v
        WHERE v."created_by" = u."user_id"
          AND v."status" = ${enumValue("Kinnitatud")}
      ) AS "vehicles_confirmed",

      (
        SELECT COUNT(*)::int
        FROM ${table("Vehicles")} v
        WHERE v."created_by" = u."user_id"
          AND v."status" = ${enumValue("Tagasi_lukatud")}
      ) AS "vehicles_rejected",

      (
        SELECT COUNT(*)::int
        FROM ${table("Photos")} p
        WHERE p."author_id" = u."user_id"
      ) AS "photos_total",

      (
        SELECT COUNT(*)::int
        FROM ${table("Photos")} p
        WHERE p."author_id" = u."user_id"
          AND p."status" = ${enumValue("Ootel")}
      ) AS "photos_pending",

      (
        SELECT COUNT(*)::int
        FROM ${table("Photos")} p
        WHERE p."author_id" = u."user_id"
          AND p."status" = ${enumValue("Kinnitatud")}
      ) AS "photos_confirmed",

      (
        SELECT COUNT(*)::int
        FROM ${table("Photos")} p
        WHERE p."author_id" = u."user_id"
          AND p."status" = ${enumValue("Tagasi_lukatud")}
      ) AS "photos_rejected"

    FROM ${table("Users")} u;


    CREATE VIEW ${view("v_public_stats")} AS
    SELECT
      (
        SELECT COUNT(*)::int
        FROM ${view("v_public_vehicles")}
      ) AS "vehicles_total",

      (
        SELECT COUNT(*)::int
        FROM ${view("v_public_photos")}
      ) AS "photos_total",

      (
        SELECT COUNT(DISTINCT "category_id")::int
        FROM ${view("v_public_vehicles")}
      ) AS "categories_total",

      (
        SELECT COUNT(DISTINCT "city_id")::int
        FROM ${view("v_public_photos")}
        WHERE "city_id" IS NOT NULL
      ) AS "cities_total";
  `);
}

async function seedCounties() {
  const result = new Map<string, number>();

  for (const county of counties) {
    const createdCounty = await prisma.counties.create({
      data: {
        name: county.name,
      },
    });

    result.set(key(county.name), createdCounty.county_id);
  }

  return result;
}

async function seedCities(countyMap: Map<string, number>) {
  const result = new Map<string, number>();

  for (const city of cities as readonly DataRecord[]) {
    const countyName = getValue<string>(city, ["countyName", "county_name"]);
    const countyId = countyMap.get(key(countyName));

    if (!countyId) {
      throw new Error(`Maakond puudub linna jaoks: ${city.name}`);
    }

    const createdCity = await prisma.cities.create({
      data: {
        name: city.name,
        county_id: countyId,
        status: ReviewStatus.Kinnitatud,
      },
    });

    result.set(key(city.name), createdCity.city_id);
    result.set(key(countyName, city.name), createdCity.city_id);
  }

  return result;
}

async function seedCategories() {
  const result = new Map<string, number>();

  for (const category of categories) {
    const createdCategory = await prisma.categories.create({
      data: {
        name: category.name,
      },
    });

    result.set(key(category.name), createdCategory.category_id);
  }

  return result;
}

async function seedModels(categoryMap: Map<string, number>) {
  const result = new Map<string, number>();

  for (const model of models as readonly DataRecord[]) {
    const categoryName = getValue<string>(model, [
      "categoryName",
      "category_name",
    ]);
    const manufacturer = getValue<string>(model, ["manufacturer", "tootja"]);
    const name = getValue<string>(model, ["name", "modelName", "model_name"]);

    const categoryId = categoryMap.get(key(categoryName));

    if (!categoryId || !manufacturer || !name) {
      throw new Error(`Mudeli andmed on vigased: ${JSON.stringify(model)}`);
    }

    const createdModel = await prisma.models.create({
      data: {
        category_id: categoryId,
        manufacturer,
        name,
        status: ReviewStatus.Kinnitatud,
      },
    });

    result.set(key(categoryName, manufacturer, name), createdModel.model_id);
    result.set(key(manufacturer, name), createdModel.model_id);
  }

  return result;
}

async function seedCompanies(cityMap: Map<string, number>) {
  const result = new Map<string, number>();

  for (const company of companies as readonly DataRecord[]) {
    const cityName = getValue<string>(company, ["cityName", "city_name"]);
    const cityId = cityName ? cityMap.get(key(cityName)) ?? null : null;

    const createdCompany = await prisma.companies.create({
      data: {
        name: company.name,
        city_id: cityId,
        status: ReviewStatus.Kinnitatud,
      },
    });

    result.set(key(company.name), createdCompany.company_id);
  }

  return result;
}

async function seedCompanyBranches(
  companyMap: Map<string, number>,
  cityMap: Map<string, number>
) {
  const result = new Map<string, number>();

  for (const branch of companyBranches as readonly DataRecord[]) {
    const companyName = getValue<string>(branch, [
      "companyName",
      "company_name",
    ]);
    const cityName = getValue<string>(branch, ["cityName", "city_name"]);
    const branchName = getValue<string>(branch, [
      "branchName",
      "branch_name",
      "name",
    ]);

    const companyId = companyMap.get(key(companyName));
    const cityId = cityMap.get(key(cityName));

    if (!companyId || !cityId || !branchName) {
      throw new Error(`Filiaali andmed on vigased: ${JSON.stringify(branch)}`);
    }

    const createdBranch = await prisma.company_branches.create({
      data: {
        company_id: companyId,
        city_id: cityId,
        branch_name: branchName,
        status: ReviewStatus.Kinnitatud,
      },
    });

    result.set(
      key(companyName, cityName, branchName),
      createdBranch.branch_id
    );
    result.set(key(companyName, branchName), createdBranch.branch_id);
    result.set(key(branchName), createdBranch.branch_id);
  }

  return result;
}

async function seedUsers() {
  const resultByEmail = new Map<string, number>();
  const resultByUsername = new Map<string, number>();

  for (const user of users) {
    const password = user.password ?? "Password123!";
    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await prisma.users.create({
      data: {
        username: user.username,
        email: user.email,
        password_hash: passwordHash,
        role: parseUserRole(user.role),
      },
    });

    resultByEmail.set(key(user.email), createdUser.user_id);
    resultByUsername.set(key(user.username), createdUser.user_id);
  }

  return {
    byEmail: resultByEmail,
    byUsername: resultByUsername,
  };
}

function findSeedUserId(
  row: DataRecord,
  userMaps: {
    byEmail: Map<string, number>;
    byUsername: Map<string, number>;
  },
  fallbackUserId?: number
) {
  const email = getValue<string>(row, [
    "email",
    "userEmail",
    "creatorEmail",
    "authorEmail",
  ]);
  const username = getValue<string>(row, [
    "username",
    "userName",
    "creatorUsername",
    "authorUsername",
  ]);

  if (email && userMaps.byEmail.has(key(email))) {
    return userMaps.byEmail.get(key(email));
  }

  if (username && userMaps.byUsername.has(key(username))) {
    return userMaps.byUsername.get(key(username));
  }

  return fallbackUserId;
}

function findReviewerId(
  row: DataRecord,
  userMaps: {
    byEmail: Map<string, number>;
    byUsername: Map<string, number>;
  },
  fallbackReviewerId?: number
) {
  const email = getValue<string>(row, ["reviewerEmail"]);
  const username = getValue<string>(row, ["reviewerUsername"]);

  if (email && userMaps.byEmail.has(key(email))) {
    return userMaps.byEmail.get(key(email));
  }

  if (username && userMaps.byUsername.has(key(username))) {
    return userMaps.byUsername.get(key(username));
  }

  return fallbackReviewerId;
}

async function seedVehicles(
  modelMap: Map<string, number>,
  branchMap: Map<string, number>,
  userMaps: {
    byEmail: Map<string, number>;
    byUsername: Map<string, number>;
  }
) {
  const result = new Map<string, number>();

  const fallbackUserId =
    Array.from(userMaps.byEmail.values())[0] ??
    Array.from(userMaps.byUsername.values())[0];

  const fallbackReviewerId = Array.from(userMaps.byUsername.values())[1];

  if (!fallbackUserId) {
    throw new Error("Vähemalt üks kasutaja peab seed andmetes olemas olema.");
  }

  for (const vehicle of vehicles as readonly DataRecord[]) {
    const regNumber = getValue<string>(vehicle, ["reg_number", "regNumber"]);

    const categoryName = getValue<string>(vehicle, [
      "categoryName",
      "category_name",
    ]);
    const manufacturer = getValue<string>(vehicle, ["manufacturer", "tootja"]);
    const modelName = getValue<string>(vehicle, [
      "modelName",
      "model_name",
      "model",
    ]);

    const modelId =
      modelMap.get(key(categoryName, manufacturer, modelName)) ??
      modelMap.get(key(manufacturer, modelName));

    if (!regNumber || !modelId) {
      throw new Error(`Sõiduki mudel puudub: ${JSON.stringify(vehicle)}`);
    }

    const companyName = getValue<string>(vehicle, [
      "companyName",
      "company_name",
    ]);
    const cityName = getValue<string>(vehicle, ["cityName", "city_name"]);
    const branchName = getValue<string>(vehicle, [
      "branchName",
      "branch_name",
    ]);

    const branchId = branchName
      ? branchMap.get(key(companyName, cityName, branchName)) ??
        branchMap.get(key(companyName, branchName)) ??
        branchMap.get(key(branchName)) ??
        null
      : null;

    const status = parseReviewStatus(
      getValue(vehicle, ["status"]),
      ReviewStatus.Kinnitatud
    );

    const creatorId =
      findSeedUserId(vehicle, userMaps, fallbackUserId) ?? fallbackUserId;

    const reviewerId =
      status === ReviewStatus.Ootel
        ? null
        : findReviewerId(vehicle, userMaps, fallbackReviewerId) ?? null;

    const createdVehicle = await prisma.vehicles.create({
      data: {
        model_id: modelId,
        branch_id: branchId,
        reg_number: regNumber,
        vla_year: getValue<number>(vehicle, ["vla_year", "vlaYear"]),
        vin_code: getValue<string>(vehicle, ["vin_code", "vinCode"]),
        chassis: getValue<string>(vehicle, ["chassis"]),
        condition: parseVehicleCondition(
          getValue(vehicle, ["condition"]),
          VehicleCondition.Teadmata
        ),
        status,
        review_comment: getValue<string>(vehicle, ["review_comment"]),
        created_by: creatorId,
        reviewed_by: reviewerId,
        reviewed_at:
          status === ReviewStatus.Ootel
            ? null
            : toDate(getValue(vehicle, ["reviewed_at", "reviewedAt"])) ??
              new Date(),
      },
    });

    result.set(key(regNumber), createdVehicle.vehicle_id);
  }

  return result;
}

async function seedPhotos(
  vehicleMap: Map<string, number>,
  cityMap: Map<string, number>,
  userMaps: {
    byEmail: Map<string, number>;
    byUsername: Map<string, number>;
  }
) {
  const fallbackUserId =
    Array.from(userMaps.byEmail.values())[0] ??
    Array.from(userMaps.byUsername.values())[0];

  const fallbackReviewerId = Array.from(userMaps.byUsername.values())[1];

  if (!fallbackUserId) {
    throw new Error("Vähemalt üks kasutaja peab seed andmetes olemas olema.");
  }

  for (const photo of photos as readonly DataRecord[]) {
    const regNumber = getValue<string>(photo, [
      "reg_number",
      "regNumber",
      "vehicleRegNumber",
      "vehicle_reg_number",
    ]);

    const vehicleId = vehicleMap.get(key(regNumber));

    if (!vehicleId) {
      throw new Error(`Foto sõiduk puudub: ${JSON.stringify(photo)}`);
    }

    const cityName = getValue<string>(photo, ["cityName", "city_name"]);
    const cityId = cityName ? cityMap.get(key(cityName)) ?? null : null;

    const status = parseReviewStatus(
      getValue(photo, ["status"]),
      ReviewStatus.Kinnitatud
    );

    const authorId =
      findSeedUserId(photo, userMaps, fallbackUserId) ?? fallbackUserId;

    const reviewerId =
      status === ReviewStatus.Ootel
        ? null
        : findReviewerId(photo, userMaps, fallbackReviewerId) ?? null;

    await prisma.photos.create({
      data: {
        vehicle_id: vehicleId,
        author_id: authorId,
        city_id: cityId,
        place: getValue<string>(photo, ["place"]),
        taken_at: toDate(getValue(photo, ["taken_at", "takenAt"])),
        file_path:
          getValue<string>(photo, ["file_path", "filePath", "url"]) ??
          "https://placehold.co/1200x760/e2e8f0/475569?text=TransitView",
        cloudinary_public_id: getValue<string>(photo, [
          "cloudinary_public_id",
          "cloudinaryPublicId",
        ]),
        status,
        review_comment: getValue<string>(photo, ["review_comment"]),
        reviewed_by: reviewerId,
        reviewed_at:
          status === ReviewStatus.Ootel
            ? null
            : toDate(getValue(photo, ["reviewed_at", "reviewedAt"])) ??
              new Date(),
      },
    });
  }
}

async function main() {
  console.log("======================================");
  console.log("TransitView seed started");
  console.log("Schema:", DB_SCHEMA);
  console.log("======================================");

  console.log("Dropping old views...");
  await dropViews();
  console.log("✅ Views dropped successfully.");

  console.log("Cleaning tables...");
  await truncateAllTables();
  console.log("✅ Tables truncated successfully.");

  console.log("Creating review function...");
  await createReviewFunction();
  console.log("✅ Review function created successfully.");

  console.log("Creating review triggers...");
  await createReviewTriggers();
  console.log("✅ Review triggers created successfully.");

  const countyMap = await seedCounties();
  console.log(`✅ Counties seeded: ${countyMap.size}`);

  const cityMap = await seedCities(countyMap);
  console.log(`✅ Cities seeded: ${cityMap.size}`);

  const categoryMap = await seedCategories();
  console.log(`✅ Categories seeded: ${categoryMap.size}`);

  const modelMap = await seedModels(categoryMap);
  console.log(`✅ Models seeded: ${modelMap.size}`);

  const companyMap = await seedCompanies(cityMap);
  console.log(`✅ Companies seeded: ${companyMap.size}`);

  const branchMap = await seedCompanyBranches(companyMap, cityMap);
  console.log(`✅ Company branches seeded: ${branchMap.size}`);

  const userMaps = await seedUsers();
  console.log(
    `✅ Users seeded: ${userMaps.byUsername.size} usernames`
  );

  const vehicleMap = await seedVehicles(modelMap, branchMap, userMaps);
  console.log(`✅ Vehicles seeded: ${vehicleMap.size}`);

  await seedPhotos(vehicleMap, cityMap, userMaps);
  console.log(`✅ Photos seeded: ${photos.length}`);

  console.log("Creating views...");
  await createViews();
  console.log("✅ Views created successfully.");

  console.log("======================================");
  console.log("✅ Seed finished successfully.");
  console.log("======================================");
}

main()
  .catch((error) => {
    console.error("======================================");
    console.error("❌ Seed failed.");
    console.error(error);
    console.error("======================================");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });