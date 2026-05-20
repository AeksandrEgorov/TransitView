-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Kasutaja', 'Andmebaasi_toimetaja', 'Administraator');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('Ootel', 'Kinnitatud', 'Tagasi_lukatud');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('Töökorras', 'Ei_tööta', 'Maha_kantud', 'Müüdud', 'Teadmata');

-- CreateTable
CREATE TABLE "Users" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'Kasutaja',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Counties" (
    "county_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Counties_pkey" PRIMARY KEY ("county_id")
);

-- CreateTable
CREATE TABLE "Cities" (
    "city_id" SERIAL NOT NULL,
    "county_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'Ootel',
    "created_by" INTEGER,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "review_comment" TEXT,

    CONSTRAINT "Cities_pkey" PRIMARY KEY ("city_id")
);

-- CreateTable
CREATE TABLE "Categories" (
    "category_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "Models" (
    "model_id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'Ootel',
    "created_by" INTEGER,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "review_comment" TEXT,

    CONSTRAINT "Models_pkey" PRIMARY KEY ("model_id")
);

-- CreateTable
CREATE TABLE "Companies" (
    "company_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city_id" INTEGER,
    "status" "ReviewStatus" NOT NULL DEFAULT 'Ootel',
    "created_by" INTEGER,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "review_comment" TEXT,

    CONSTRAINT "Companies_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "Company_branches" (
    "branch_id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "city_id" INTEGER NOT NULL,
    "branch_name" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'Ootel',
    "created_by" INTEGER,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "review_comment" TEXT,

    CONSTRAINT "Company_branches_pkey" PRIMARY KEY ("branch_id")
);

-- CreateTable
CREATE TABLE "Vehicles" (
    "vehicle_id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "branch_id" INTEGER,
    "reg_number" TEXT NOT NULL,
    "vla_year" INTEGER,
    "vin_code" TEXT,
    "chassis" TEXT,
    "condition" "VehicleCondition" NOT NULL DEFAULT 'Teadmata',
    "status" "ReviewStatus" NOT NULL DEFAULT 'Ootel',
    "review_comment" TEXT,
    "created_by" INTEGER NOT NULL,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicles_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateTable
CREATE TABLE "Photos" (
    "photo_id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "city_id" INTEGER,
    "place" TEXT,
    "taken_at" TIMESTAMP(3),
    "file_path" TEXT NOT NULL,
    "cloudinary_public_id" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'Ootel',
    "review_comment" TEXT,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photos_pkey" PRIMARY KEY ("photo_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Counties_name_key" ON "Counties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Cities_county_id_name_key" ON "Cities"("county_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Categories_name_key" ON "Categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Models_category_id_manufacturer_name_key" ON "Models"("category_id", "manufacturer", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Companies_name_key" ON "Companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_branches_company_id_city_id_branch_name_key" ON "Company_branches"("company_id", "city_id", "branch_name");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicles_reg_number_key" ON "Vehicles"("reg_number");

-- AddForeignKey
ALTER TABLE "Cities" ADD CONSTRAINT "Cities_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "Counties"("county_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cities" ADD CONSTRAINT "Cities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cities" ADD CONSTRAINT "Cities_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Models" ADD CONSTRAINT "Models_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Models" ADD CONSTRAINT "Models_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Models" ADD CONSTRAINT "Models_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companies" ADD CONSTRAINT "Companies_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "Cities"("city_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companies" ADD CONSTRAINT "Companies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companies" ADD CONSTRAINT "Companies_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company_branches" ADD CONSTRAINT "Company_branches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company_branches" ADD CONSTRAINT "Company_branches_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "Cities"("city_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company_branches" ADD CONSTRAINT "Company_branches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company_branches" ADD CONSTRAINT "Company_branches_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "Models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Company_branches"("branch_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photos" ADD CONSTRAINT "Photos_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photos" ADD CONSTRAINT "Photos_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photos" ADD CONSTRAINT "Photos_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photos" ADD CONSTRAINT "Photos_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "Cities"("city_id") ON DELETE SET NULL ON UPDATE CASCADE;
