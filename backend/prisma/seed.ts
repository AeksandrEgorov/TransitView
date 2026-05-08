import "dotenv/config";
import bcrypt from "bcrypt";
import {
  PrismaClient,
  UserRole,
  ReviewStatus,
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

function table(name: string) {
  return `"${DB_SCHEMA}"."${name}"`;
}

function view(name: string) {
  return `"${DB_SCHEMA}"."${name}"`;
}

function routine(name: string) {
  return `"${DB_SCHEMA}"."${name}"`;
}

function dbType(name: string) {
  return `"${DB_SCHEMA}"."${name}"`;
}

async function truncateAllTables() {
  console.log("Cleaning database with TRUNCATE...");

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

  console.log("Database cleaned. Identity counters restarted.");
}

async function recreateDatabaseViews() {
  console.log("Recreating database views...");

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

  await prisma.$executeRawUnsafe(`
    CREATE VIEW ${view("v_public_vehicles")} AS
    SELECT
      v.vehicle_id,
      v.reg_number,
      v.vla_year,
      v.vin_code,
      v.chassis,
      v.condition::text AS condition,
      v.status::text AS status,
      v.created_at,

      m.model_id,
      m.manufacturer,
      m.name AS model_name,

      cat.category_id,
      cat.name AS category_name,

      cb.branch_id,
      cb.branch_name,

      comp.company_id,
      comp.name AS company_name,

      branch_city.city_id AS branch_city_id,
      branch_city.name AS branch_city_name,

      branch_county.county_id AS branch_county_id,
      branch_county.name AS branch_county_name,

      creator.user_id AS creator_id,
      creator.username AS creator_username,

      cover.photo_id AS cover_photo_id,
      cover.file_path AS cover_photo_url,
      cover.cloudinary_public_id AS cover_photo_cloudinary_public_id,
      cover.place AS cover_photo_place,
      cover.taken_at AS cover_photo_taken_at,
      cover.created_at AS cover_photo_created_at,
      cover.city_id AS cover_photo_city_id,
      cover.city_name AS cover_photo_city_name,
      cover.county_id AS cover_photo_county_id,
      cover.county_name AS cover_photo_county_name,

      photo_stats.confirmed_photos_count

    FROM ${table("Vehicles")} v
    JOIN ${table("Models")} m
      ON v.model_id = m.model_id
    JOIN ${table("Categories")} cat
      ON m.category_id = cat.category_id
    LEFT JOIN ${table("Company_branches")} cb
      ON v.branch_id = cb.branch_id
    LEFT JOIN ${table("Companies")} comp
      ON cb.company_id = comp.company_id
    LEFT JOIN ${table("Cities")} branch_city
      ON cb.city_id = branch_city.city_id
    LEFT JOIN ${table("Counties")} branch_county
      ON branch_city.county_id = branch_county.county_id
    LEFT JOIN ${table("Users")} creator
      ON v.created_by = creator.user_id

    LEFT JOIN LATERAL (
      SELECT
        p.photo_id,
        p.file_path,
        p.cloudinary_public_id,
        p.place,
        p.taken_at,
        p.created_at,
        city.city_id,
        city.name AS city_name,
        county.county_id,
        county.name AS county_name
      FROM ${table("Photos")} p
      LEFT JOIN ${table("Cities")} city
        ON p.city_id = city.city_id
      LEFT JOIN ${table("Counties")} county
        ON city.county_id = county.county_id
      WHERE
        p.vehicle_id = v.vehicle_id
        AND p.status = 'Kinnitatud'
      ORDER BY p.created_at ASC, p.photo_id ASC
      LIMIT 1
    ) cover ON true

    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS confirmed_photos_count
      FROM ${table("Photos")} p
      WHERE
        p.vehicle_id = v.vehicle_id
        AND p.status = 'Kinnitatud'
    ) photo_stats ON true

    WHERE v.status = 'Kinnitatud';
  `);

  await prisma.$executeRawUnsafe(`
    CREATE VIEW ${view("v_public_photos")} AS
    SELECT
      p.photo_id,
      p.vehicle_id,
      p.author_id,
      p.city_id,
      p.place,
      p.taken_at,
      p.file_path,
      p.cloudinary_public_id,
      p.status::text AS status,
      p.created_at,

      v.reg_number,
      v.vla_year,
      v.condition::text AS vehicle_condition,

      m.model_id,
      m.manufacturer,
      m.name AS model_name,

      cat.category_id,
      cat.name AS category_name,

      city.name AS city_name,
      county.county_id,
      county.name AS county_name,

      author.username AS author_username

    FROM ${table("Photos")} p
    JOIN ${table("Vehicles")} v
      ON p.vehicle_id = v.vehicle_id
    JOIN ${table("Models")} m
      ON v.model_id = m.model_id
    JOIN ${table("Categories")} cat
      ON m.category_id = cat.category_id
    LEFT JOIN ${table("Cities")} city
      ON p.city_id = city.city_id
    LEFT JOIN ${table("Counties")} county
      ON city.county_id = county.county_id
    LEFT JOIN ${table("Users")} author
      ON p.author_id = author.user_id
    WHERE
      p.status = 'Kinnitatud'
      AND v.status = 'Kinnitatud';
  `);

  await prisma.$executeRawUnsafe(`
    CREATE VIEW ${view("v_public_vehicle_photos")} AS
    SELECT
      p.photo_id,
      p.vehicle_id,
      p.city_id,
      p.place,
      p.taken_at,
      p.file_path,
      p.cloudinary_public_id,
      p.status::text AS status,
      p.created_at,

      city.name AS city_name,
      county.county_id,
      county.name AS county_name,

      author.user_id AS author_id,
      author.username AS author_username

    FROM ${table("Photos")} p
    JOIN ${table("Vehicles")} v
      ON p.vehicle_id = v.vehicle_id
    LEFT JOIN ${table("Cities")} city
      ON p.city_id = city.city_id
    LEFT JOIN ${table("Counties")} county
      ON city.county_id = county.county_id
    LEFT JOIN ${table("Users")} author
      ON p.author_id = author.user_id
    WHERE
      p.status = 'Kinnitatud'
      AND v.status = 'Kinnitatud';
  `);

  await prisma.$executeRawUnsafe(`
    CREATE VIEW ${view("v_my_vehicles")} AS
    SELECT
      v.vehicle_id,
      v.model_id,
      v.branch_id,
      v.reg_number,
      v.vla_year,
      v.vin_code,
      v.chassis,
      v.condition::text AS condition,
      v.status::text AS status,
      v.review_comment,
      v.created_by,
      v.reviewed_by,
      v.reviewed_at,
      v.created_at,

      m.manufacturer,
      m.name AS model_name,

      cat.category_id,
      cat.name AS category_name,

      cb.branch_name,
      comp.name AS company_name,

      creator.username AS creator_username,
      reviewer.username AS reviewer_username,

      cover.photo_id AS cover_photo_id,
      cover.file_path AS cover_photo_url,
      cover.cloudinary_public_id AS cover_photo_cloudinary_public_id,

      photo_stats.photos_count

    FROM ${table("Vehicles")} v
    JOIN ${table("Models")} m
      ON v.model_id = m.model_id
    JOIN ${table("Categories")} cat
      ON m.category_id = cat.category_id
    LEFT JOIN ${table("Company_branches")} cb
      ON v.branch_id = cb.branch_id
    LEFT JOIN ${table("Companies")} comp
      ON cb.company_id = comp.company_id
    LEFT JOIN ${table("Users")} creator
      ON v.created_by = creator.user_id
    LEFT JOIN ${table("Users")} reviewer
      ON v.reviewed_by = reviewer.user_id

    LEFT JOIN LATERAL (
      SELECT
        p.photo_id,
        p.file_path,
        p.cloudinary_public_id
      FROM ${table("Photos")} p
      WHERE p.vehicle_id = v.vehicle_id
      ORDER BY p.created_at ASC, p.photo_id ASC
      LIMIT 1
    ) cover ON true

    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS photos_count
      FROM ${table("Photos")} p
      WHERE p.vehicle_id = v.vehicle_id
    ) photo_stats ON true;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE VIEW ${view("v_my_photos")} AS
    SELECT
      p.photo_id,
      p.vehicle_id,
      p.author_id,
      p.city_id,
      p.place,
      p.taken_at,
      p.file_path,
      p.cloudinary_public_id,
      p.status::text AS status,
      p.review_comment,
      p.reviewed_at,
      p.created_at,

      v.reg_number,
      v.status::text AS vehicle_status,
      v.condition::text AS vehicle_condition,

      m.manufacturer,
      m.name AS model_name,

      cat.category_id,
      cat.name AS category_name,

      city.name AS city_name,
      county.county_id,
      county.name AS county_name,

      author.username AS author_username

    FROM ${table("Photos")} p
    JOIN ${table("Vehicles")} v
      ON p.vehicle_id = v.vehicle_id
    JOIN ${table("Models")} m
      ON v.model_id = m.model_id
    JOIN ${table("Categories")} cat
      ON m.category_id = cat.category_id
    LEFT JOIN ${table("Cities")} city
      ON p.city_id = city.city_id
    LEFT JOIN ${table("Counties")} county
      ON city.county_id = county.county_id
    LEFT JOIN ${table("Users")} author
      ON p.author_id = author.user_id;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE VIEW ${view("v_manage_vehicles")} AS
    SELECT
      v.vehicle_id,
      v.model_id,
      v.branch_id,
      v.reg_number,
      v.vla_year,
      v.vin_code,
      v.chassis,
      v.condition::text AS condition,
      v.status::text AS status,
      v.review_comment,
      v.created_by,
      v.reviewed_by,
      v.reviewed_at,
      v.created_at,

      m.manufacturer,
      m.name AS model_name,

      cat.category_id,
      cat.name AS category_name,

      cb.branch_name,

      comp.company_id,
      comp.name AS company_name,

      branch_city.city_id AS branch_city_id,
      branch_city.name AS branch_city_name,

      branch_county.county_id AS branch_county_id,
      branch_county.name AS branch_county_name,

      creator.username AS creator_username,
      creator.role::text AS creator_role,

      reviewer.username AS reviewer_username,
      reviewer.role::text AS reviewer_role,

      cover.photo_id AS cover_photo_id,
      cover.file_path AS cover_photo_url,
      cover.cloudinary_public_id AS cover_photo_cloudinary_public_id,
      cover.status AS cover_photo_status,
      cover.city_id AS cover_photo_city_id,
      cover.city_name AS cover_photo_city_name,
      cover.county_id AS cover_photo_county_id,
      cover.county_name AS cover_photo_county_name,

      photo_stats.total_photos_count,
      photo_stats.pending_photos_count,
      photo_stats.confirmed_photos_count,
      photo_stats.rejected_photos_count

    FROM ${table("Vehicles")} v
    JOIN ${table("Models")} m
      ON v.model_id = m.model_id
    JOIN ${table("Categories")} cat
      ON m.category_id = cat.category_id
    LEFT JOIN ${table("Company_branches")} cb
      ON v.branch_id = cb.branch_id
    LEFT JOIN ${table("Companies")} comp
      ON cb.company_id = comp.company_id
    LEFT JOIN ${table("Cities")} branch_city
      ON cb.city_id = branch_city.city_id
    LEFT JOIN ${table("Counties")} branch_county
      ON branch_city.county_id = branch_county.county_id
    LEFT JOIN ${table("Users")} creator
      ON v.created_by = creator.user_id
    LEFT JOIN ${table("Users")} reviewer
      ON v.reviewed_by = reviewer.user_id

    LEFT JOIN LATERAL (
      SELECT
        p.photo_id,
        p.file_path,
        p.cloudinary_public_id,
        p.status::text AS status,
        city.city_id,
        city.name AS city_name,
        county.county_id,
        county.name AS county_name
      FROM ${table("Photos")} p
      LEFT JOIN ${table("Cities")} city
        ON p.city_id = city.city_id
      LEFT JOIN ${table("Counties")} county
        ON city.county_id = county.county_id
      WHERE p.vehicle_id = v.vehicle_id
      ORDER BY p.created_at ASC, p.photo_id ASC
      LIMIT 1
    ) cover ON true

    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS total_photos_count,
        COUNT(*) FILTER (WHERE p.status = 'Ootel')::int AS pending_photos_count,
        COUNT(*) FILTER (WHERE p.status = 'Kinnitatud')::int AS confirmed_photos_count,
        COUNT(*) FILTER (WHERE p.status = 'Tagasi_lukatud')::int AS rejected_photos_count
      FROM ${table("Photos")} p
      WHERE p.vehicle_id = v.vehicle_id
    ) photo_stats ON true;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE VIEW ${view("v_manage_photos")} AS
    SELECT
      p.photo_id,
      p.vehicle_id,
      p.author_id,
      p.city_id,
      p.place,
      p.taken_at,
      p.file_path,
      p.cloudinary_public_id,
      p.status::text AS status,
      p.review_comment,
      p.reviewed_at,
      p.created_at,

      v.reg_number,
      v.status::text AS vehicle_status,
      v.condition::text AS vehicle_condition,
      v.created_by AS vehicle_created_by,

      m.model_id,
      m.manufacturer,
      m.name AS model_name,

      cat.category_id,
      cat.name AS category_name,

      city.name AS city_name,
      county.county_id,
      county.name AS county_name,

      cb.branch_id,
      cb.branch_name,

      comp.company_id,
      comp.name AS company_name,

      branch_city.city_id AS branch_city_id,
      branch_city.name AS branch_city_name,

      branch_county.county_id AS branch_county_id,
      branch_county.name AS branch_county_name,

      author.username AS author_username,
      author.role::text AS author_role,

      vehicle_creator.username AS vehicle_creator_username,
      vehicle_creator.role::text AS vehicle_creator_role

    FROM ${table("Photos")} p
    JOIN ${table("Vehicles")} v
      ON p.vehicle_id = v.vehicle_id
    JOIN ${table("Models")} m
      ON v.model_id = m.model_id
    JOIN ${table("Categories")} cat
      ON m.category_id = cat.category_id
    LEFT JOIN ${table("Cities")} city
      ON p.city_id = city.city_id
    LEFT JOIN ${table("Counties")} county
      ON city.county_id = county.county_id
    LEFT JOIN ${table("Company_branches")} cb
      ON v.branch_id = cb.branch_id
    LEFT JOIN ${table("Companies")} comp
      ON cb.company_id = comp.company_id
    LEFT JOIN ${table("Cities")} branch_city
      ON cb.city_id = branch_city.city_id
    LEFT JOIN ${table("Counties")} branch_county
      ON branch_city.county_id = branch_county.county_id
    LEFT JOIN ${table("Users")} author
      ON p.author_id = author.user_id
    LEFT JOIN ${table("Users")} vehicle_creator
      ON v.created_by = vehicle_creator.user_id;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE VIEW ${view("v_moderation_queue")} AS
    SELECT
      'vehicle' AS item_type,
      v.vehicle_id AS item_id,
      v.vehicle_id,
      NULL::int AS photo_id,
      v.reg_number AS title,
      NULL::text AS file_path,
      v.status::text AS status,
      v.review_comment,
      v.created_at,
      v.created_by AS created_by_user_id,
      creator.username AS created_by_username
    FROM ${table("Vehicles")} v
    LEFT JOIN ${table("Users")} creator
      ON v.created_by = creator.user_id
    WHERE v.status = 'Ootel'

    UNION ALL

    SELECT
      'photo' AS item_type,
      p.photo_id AS item_id,
      p.vehicle_id,
      p.photo_id,
      v.reg_number || ' foto' AS title,
      p.file_path,
      p.status::text AS status,
      p.review_comment,
      p.created_at,
      p.author_id AS created_by_user_id,
      author.username AS created_by_username
    FROM ${table("Photos")} p
    JOIN ${table("Vehicles")} v
      ON p.vehicle_id = v.vehicle_id
    LEFT JOIN ${table("Users")} author
      ON p.author_id = author.user_id
    WHERE p.status = 'Ootel';
  `);

  await prisma.$executeRawUnsafe(`
    CREATE VIEW ${view("v_admin_users")} AS
    SELECT
      u.user_id,
      u.username,
      u.role::text AS role,
      u.created_at,

      vehicle_stats.vehicles_count,
      photo_stats.photos_count,

      vehicle_stats.pending_vehicles_count,
      vehicle_stats.confirmed_vehicles_count,
      vehicle_stats.rejected_vehicles_count,

      photo_stats.pending_photos_count,
      photo_stats.confirmed_photos_count,
      photo_stats.rejected_photos_count

    FROM ${table("Users")} u

    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS vehicles_count,
        COUNT(*) FILTER (WHERE v.status = 'Ootel')::int AS pending_vehicles_count,
        COUNT(*) FILTER (WHERE v.status = 'Kinnitatud')::int AS confirmed_vehicles_count,
        COUNT(*) FILTER (WHERE v.status = 'Tagasi_lukatud')::int AS rejected_vehicles_count
      FROM ${table("Vehicles")} v
      WHERE v.created_by = u.user_id
    ) vehicle_stats ON true

    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS photos_count,
        COUNT(*) FILTER (WHERE p.status = 'Ootel')::int AS pending_photos_count,
        COUNT(*) FILTER (WHERE p.status = 'Kinnitatud')::int AS confirmed_photos_count,
        COUNT(*) FILTER (WHERE p.status = 'Tagasi_lukatud')::int AS rejected_photos_count
      FROM ${table("Photos")} p
      WHERE p.author_id = u.user_id
    ) photo_stats ON true;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE VIEW ${view("v_public_stats")} AS
    SELECT
      (
        SELECT COUNT(*)::int
        FROM ${table("Vehicles")} v
        WHERE v.status = 'Kinnitatud'
      ) AS vehicles_total,

      (
        SELECT COUNT(*)::int
        FROM ${table("Photos")} p
        JOIN ${table("Vehicles")} v
          ON p.vehicle_id = v.vehicle_id
        WHERE
          p.status = 'Kinnitatud'
          AND v.status = 'Kinnitatud'
      ) AS photos_total,

      (
        SELECT COUNT(DISTINCT m.category_id)::int
        FROM ${table("Vehicles")} v
        JOIN ${table("Models")} m
          ON v.model_id = m.model_id
        WHERE v.status = 'Kinnitatud'
      ) AS categories_total,

      (
        SELECT COUNT(DISTINCT p.city_id)::int
        FROM ${table("Photos")} p
        JOIN ${table("Vehicles")} v
          ON p.vehicle_id = v.vehicle_id
        WHERE
          p.status = 'Kinnitatud'
          AND v.status = 'Kinnitatud'
          AND p.city_id IS NOT NULL
      ) AS cities_total;
  `);

  console.log("Database views recreated successfully.");
}

async function recreateDatabaseRoutines() {
  console.log("Recreating database trigger and procedures...");

  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS trg_set_vehicle_reviewed_at
    ON ${table("Vehicles")};

    DROP FUNCTION IF EXISTS ${routine("set_vehicle_reviewed_at")}() CASCADE;

    DROP PROCEDURE IF EXISTS ${routine("sp_add_vehicle")}(
      INTEGER,
      INTEGER,
      VARCHAR,
      SMALLINT,
      VARCHAR,
      VARCHAR,
      ${dbType("ReviewStatus")},
      ${dbType("VehicleCondition")},
      INTEGER
    );

    DROP PROCEDURE IF EXISTS ${routine("sp_update_vehicle")}(
      INTEGER,
      INTEGER,
      INTEGER,
      VARCHAR,
      SMALLINT,
      VARCHAR,
      VARCHAR,
      ${dbType("ReviewStatus")},
      ${dbType("VehicleCondition")},
      INTEGER
    );

    DROP PROCEDURE IF EXISTS ${routine("sp_update_vehicle")}(
      INTEGER,
      INTEGER,
      INTEGER,
      VARCHAR,
      SMALLINT,
      VARCHAR,
      VARCHAR,
      ${dbType("ReviewStatus")},
      ${dbType("VehicleCondition")},
      INTEGER,
      TEXT
    );

    DROP PROCEDURE IF EXISTS ${routine("sp_delete_vehicle")}(INTEGER);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION ${routine("set_vehicle_reviewed_at")}()
    RETURNS trigger AS $$
    BEGIN
      IF NEW."status" IS DISTINCT FROM OLD."status" THEN

        IF NEW."status" IN (
          'Kinnitatud'::${dbType("ReviewStatus")},
          'Tagasi_lukatud'::${dbType("ReviewStatus")}
        ) THEN
          NEW."reviewed_at" := CURRENT_TIMESTAMP;
        END IF;

        IF NEW."status" = 'Ootel'::${dbType("ReviewStatus")} THEN
          NEW."reviewed_at" := NULL;
          NEW."reviewed_by" := NULL;
          NEW."review_comment" := NULL;
        END IF;

      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_set_vehicle_reviewed_at
    BEFORE UPDATE OF "status"
    ON ${table("Vehicles")}
    FOR EACH ROW
    EXECUTE FUNCTION ${routine("set_vehicle_reviewed_at")}();
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE PROCEDURE ${routine("sp_add_vehicle")}(
      IN p_model_id INTEGER,
      IN p_branch_id INTEGER,
      IN p_reg_number VARCHAR(20),
      IN p_vla_year SMALLINT,
      IN p_vin_code VARCHAR(30),
      IN p_chassis VARCHAR(100),
      IN p_status ${dbType("ReviewStatus")},
      IN p_condition ${dbType("VehicleCondition")},
      IN p_created_by INTEGER
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF p_reg_number IS NULL OR btrim(p_reg_number) = '' THEN
        RAISE EXCEPTION 'reg_number ei tohi olla tühi';
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM ${table("Models")}
        WHERE "model_id" = p_model_id
      ) THEN
        RAISE EXCEPTION 'Mudelit model_id=% ei eksisteeri', p_model_id;
      END IF;

      IF p_branch_id IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM ${table("Company_branches")}
        WHERE "branch_id" = p_branch_id
      ) THEN
        RAISE EXCEPTION 'Filiaali branch_id=% ei eksisteeri', p_branch_id;
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM ${table("Users")}
        WHERE "user_id" = p_created_by
      ) THEN
        RAISE EXCEPTION 'Kasutajat created_by=% ei eksisteeri', p_created_by;
      END IF;

      IF p_vla_year IS NOT NULL
        AND (
          p_vla_year < 1900
          OR p_vla_year > EXTRACT(YEAR FROM CURRENT_DATE) + 1
        ) THEN
        RAISE EXCEPTION 'vla_year väärtus % ei ole lubatud', p_vla_year;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM ${table("Vehicles")}
        WHERE "reg_number" = btrim(p_reg_number)
      ) THEN
        RAISE EXCEPTION 'Sõiduk registrinumbriga % on juba olemas', p_reg_number;
      END IF;

      INSERT INTO ${table("Vehicles")} (
        "model_id",
        "branch_id",
        "reg_number",
        "vla_year",
        "vin_code",
        "chassis",
        "status",
        "condition",
        "created_by"
      )
      VALUES (
        p_model_id,
        p_branch_id,
        btrim(p_reg_number),
        p_vla_year,
        NULLIF(btrim(p_vin_code), ''),
        NULLIF(btrim(p_chassis), ''),
        COALESCE(p_status, 'Ootel'::${dbType("ReviewStatus")}),
        COALESCE(p_condition, 'Teadmata'::${dbType("VehicleCondition")}),
        p_created_by
      );
    END;
    $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE PROCEDURE ${routine("sp_update_vehicle")}(
      IN p_vehicle_id INTEGER,
      IN p_model_id INTEGER,
      IN p_branch_id INTEGER,
      IN p_reg_number VARCHAR(20),
      IN p_vla_year SMALLINT,
      IN p_vin_code VARCHAR(30),
      IN p_chassis VARCHAR(100),
      IN p_status ${dbType("ReviewStatus")},
      IN p_condition ${dbType("VehicleCondition")},
      IN p_reviewed_by INTEGER,
      IN p_review_comment TEXT
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM ${table("Vehicles")}
        WHERE "vehicle_id" = p_vehicle_id
      ) THEN
        RAISE EXCEPTION 'Sõidukit vehicle_id=% ei leitud', p_vehicle_id;
      END IF;

      IF p_model_id IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM ${table("Models")}
        WHERE "model_id" = p_model_id
      ) THEN
        RAISE EXCEPTION 'Mudelit model_id=% ei eksisteeri', p_model_id;
      END IF;

      IF p_branch_id IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM ${table("Company_branches")}
        WHERE "branch_id" = p_branch_id
      ) THEN
        RAISE EXCEPTION 'Filiaali branch_id=% ei eksisteeri', p_branch_id;
      END IF;

      IF p_reviewed_by IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM ${table("Users")}
        WHERE "user_id" = p_reviewed_by
      ) THEN
        RAISE EXCEPTION 'Kontrollijat user_id=% ei eksisteeri', p_reviewed_by;
      END IF;

      IF p_reg_number IS NOT NULL AND btrim(p_reg_number) = '' THEN
        RAISE EXCEPTION 'reg_number ei tohi olla tühi';
      END IF;

      IF p_vla_year IS NOT NULL
        AND (
          p_vla_year < 1900
          OR p_vla_year > EXTRACT(YEAR FROM CURRENT_DATE) + 1
        ) THEN
        RAISE EXCEPTION 'vla_year väärtus % ei ole lubatud', p_vla_year;
      END IF;

      IF p_reg_number IS NOT NULL AND EXISTS (
        SELECT 1
        FROM ${table("Vehicles")}
        WHERE "reg_number" = btrim(p_reg_number)
          AND "vehicle_id" <> p_vehicle_id
      ) THEN
        RAISE EXCEPTION 'Teisel sõidukil on juba registrinumber %', p_reg_number;
      END IF;

      IF p_status = 'Tagasi_lukatud'::${dbType("ReviewStatus")}
        AND (p_review_comment IS NULL OR btrim(p_review_comment) = '') THEN
        RAISE EXCEPTION 'Tagasilükkamisel peab review_comment olema täidetud';
      END IF;

      UPDATE ${table("Vehicles")}
      SET
        "model_id" = COALESCE(p_model_id, "model_id"),
        "branch_id" = p_branch_id,
        "reg_number" = COALESCE(NULLIF(btrim(p_reg_number), ''), "reg_number"),
        "vla_year" = p_vla_year,
        "vin_code" = NULLIF(btrim(p_vin_code), ''),
        "chassis" = NULLIF(btrim(p_chassis), ''),
        "status" = COALESCE(p_status, "status"),
        "condition" = COALESCE(p_condition, "condition"),
        "reviewed_by" = p_reviewed_by,
        "review_comment" = NULLIF(btrim(p_review_comment), ''),
        "reviewed_at" = CASE
          WHEN p_reviewed_by IS NOT NULL THEN CURRENT_TIMESTAMP
          ELSE "reviewed_at"
        END
      WHERE "vehicle_id" = p_vehicle_id;
    END;
    $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE PROCEDURE ${routine("sp_delete_vehicle")}(
      IN p_vehicle_id INTEGER
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM ${table("Vehicles")}
        WHERE "vehicle_id" = p_vehicle_id
      ) THEN
        RAISE EXCEPTION 'Sõidukit vehicle_id=% ei leitud', p_vehicle_id;
      END IF;

      DELETE FROM ${table("Vehicles")}
      WHERE "vehicle_id" = p_vehicle_id;
    END;
    $$;
  `);

  console.log("Database trigger and procedures recreated successfully.");
}

async function main() {
  console.log("Seeding database...");

  await truncateAllTables();

  console.log("Seeding counties...");

  for (const county of counties) {
    await prisma.counties.create({
      data: county,
    });
  }

  console.log("Seeding cities...");

  for (const city of cities) {
    const county = await prisma.counties.findFirstOrThrow({
      where: {
        name: city.countyName,
      },
    });

    await prisma.cities.create({
      data: {
        name: city.name,
        county_id: county.county_id,
      },
    });
  }

  console.log("Seeding categories...");

  for (const category of categories) {
    await prisma.categories.create({
      data: category,
    });
  }

  console.log("Seeding models...");

  for (const model of models) {
    const category = await prisma.categories.findFirstOrThrow({
      where: {
        name: model.categoryName,
      },
    });

    await prisma.models.create({
      data: {
        manufacturer: model.manufacturer,
        name: model.name,
        category_id: category.category_id,
      },
    });
  }

  console.log("Seeding companies...");

  for (const company of companies) {
    const city = await prisma.cities.findFirstOrThrow({
      where: {
        name: company.cityName,
      },
    });

    await prisma.companies.create({
      data: {
        name: company.name,
        city_id: city.city_id,
      },
    });
  }

  console.log("Seeding company branches...");

  for (const branch of companyBranches) {
    const company = await prisma.companies.findFirstOrThrow({
      where: {
        name: branch.companyName,
      },
    });

    const city = await prisma.cities.findFirstOrThrow({
      where: {
        name: branch.cityName,
      },
    });

    await prisma.company_branches.create({
      data: {
        company_id: company.company_id,
        city_id: city.city_id,
        branch_name: branch.branchName,
      },
    });
  }

  console.log("Seeding users...");

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

  console.log("Seeding vehicles...");

  for (const vehicle of vehicles) {
    const model = await prisma.models.findFirstOrThrow({
      where: {
        manufacturer: vehicle.manufacturer,
        name: vehicle.modelName,
      },
    });

    const creator = await prisma.users.findFirstOrThrow({
      where: {
        username: vehicle.createdByUsername,
      },
    });

    const reviewer = vehicle.reviewedByUsername
      ? await prisma.users.findFirstOrThrow({
          where: {
            username: vehicle.reviewedByUsername,
          },
        })
      : null;

    const branch = vehicle.branchName
      ? await prisma.company_branches.findFirstOrThrow({
          where: {
            branch_name: vehicle.branchName,
          },
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
        condition: vehicle.condition as VehicleCondition,
        status: vehicle.status as ReviewStatus,
        created_by: creator.user_id,
        reviewed_by: reviewer?.user_id ?? null,
        reviewed_at: reviewer ? new Date() : null,
        review_comment: vehicle.reviewComment ?? null,
      },
    });
  }

  console.log("Seeding photos...");

  for (const photo of photos) {
    const vehicle = await prisma.vehicles.findFirstOrThrow({
      where: {
        reg_number: photo.regNumber,
      },
    });

    const author = await prisma.users.findFirstOrThrow({
      where: {
        username: photo.authorUsername,
      },
    });

    const city = photo.cityName
      ? await prisma.cities.findFirstOrThrow({
          where: {
            name: photo.cityName,
          },
        })
      : null;

    await prisma.photos.create({
      data: {
        vehicle_id: vehicle.vehicle_id,
        author_id: author.user_id,
        city_id: city?.city_id ?? null,
        place: photo.place ?? null,
        taken_at: photo.takenAt ? new Date(photo.takenAt) : null,
        file_path: photo.filePath,
        cloudinary_public_id: photo.cloudinaryPublicId ?? null,
        status: photo.status as ReviewStatus,
        reviewed_at: photo.status === "Kinnitatud" ? new Date() : null,
        review_comment: photo.reviewComment ?? null,
      },
    });
  }

  await recreateDatabaseViews();
  await recreateDatabaseRoutines();

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });