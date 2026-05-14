// This service contains the main vehicle database logic.
// It builds public/my queries, creates vehicles with the first photo, and keeps new references pending.

import prisma from "../config/prisma.js";
import {
  Prisma,
  ReviewStatus,
  type VehicleCondition,
} from "../generated/prisma/client.js";
import { dbView } from "../utils/dbView.js";
import { deleteCloudinaryImage } from "../utils/uploadToCloudinary.js";
import { cleanupUnusedVehicleReferences } from "./referenceCleanup.service.js";

interface GetPublicVehiclesParams {
  page: number;
  limit: number;
  regNumber?: string;
  cityId?: number;
  countyId?: number;
  categoryId?: number;
  modelId?: number;
  companyId?: number;
  branchId?: number;
  condition?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

interface GetMyVehiclesParams {
  userId: number;
  page: number;
  limit: number;
  status?: ReviewStatus;
  regNumber?: string;
  cityId?: number;
  countyId?: number;
  categoryId?: number;
  condition?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

interface CreateVehicleWithFirstPhotoData {
  model_id?: number | null;
  new_model_manufacturer?: string | null;
  new_model_name?: string | null;
  new_model_category_id?: number | null;

  branch_id?: number | null;
  new_branch_name?: string | null;
  new_branch_company_id?: number | null;

  new_company_name?: string | null;
  new_company_city_id?: number | null;
  new_company_city_name?: string | null;
  new_company_city_county_id?: number | null;

  new_branch_city_id?: number | null;
  new_branch_city_name?: string | null;
  new_branch_city_county_id?: number | null;

  reg_number: string;
  vla_year?: number | null;
  vin_code?: string | null;
  chassis?: string | null;
  condition?:
    | "Töökorras"
    | "Ei_tööta"
    | "Maha_kantud"
    | "Müüdud"
    | "Teadmata";

  city_id?: number | null;
  new_city_name?: string | null;
  new_city_county_id?: number | null;
  place?: string | null;
  taken_at?: string | null;

  file_path: string;
  cloudinary_public_id?: string | null;

  user_id: number;
}

interface UpdateVehicleData {
  model_id?: number | null;
  new_model_manufacturer?: string | null;
  new_model_name?: string | null;
  new_model_category_id?: number | null;

  branch_id?: number | null;
  new_branch_name?: string | null;
  new_branch_company_id?: number | null;

  new_company_name?: string | null;
  new_company_city_id?: number | null;
  new_company_city_name?: string | null;
  new_company_city_county_id?: number | null;

  new_branch_city_id?: number | null;
  new_branch_city_name?: string | null;
  new_branch_city_county_id?: number | null;

  reg_number?: string;
  vla_year?: number | null;
  vin_code?: string | null;
  chassis?: string | null;
  condition?:
    | "Töökorras"
    | "Ei_tööta"
    | "Maha_kantud"
    | "Müüdud"
    | "Teadmata";

  user_id: number;
}

type CountRow = {
  total: bigint | number;
};

type PublicVehicleViewRow = {
  vehicle_id: number;
  reg_number: string;
  vla_year: number | null;
  vin_code: string | null;
  chassis: string | null;
  condition: string;
  status: string;
  created_at: Date;

  model_id: number;
  manufacturer: string;
  model_name: string;

  category_id: number;
  category_name: string;

  branch_id: number | null;
  branch_name: string | null;

  company_id: number | null;
  company_name: string | null;

  branch_city_id: number | null;
  branch_city_name: string | null;
  branch_county_id: number | null;
  branch_county_name: string | null;

  creator_id: number | null;
  creator_username: string | null;

  cover_photo_id: number | null;
  cover_photo_url: string | null;
  cover_photo_cloudinary_public_id: string | null;
  cover_photo_place: string | null;
  cover_photo_taken_at: Date | null;
  cover_photo_created_at: Date | null;
  cover_photo_city_id: number | null;
  cover_photo_city_name: string | null;
  cover_photo_county_id: number | null;
  cover_photo_county_name: string | null;

  confirmed_photos_count: number;
};

type MyVehicleViewRow = {
  vehicle_id: number;
  model_id: number;
  branch_id: number | null;
  reg_number: string;
  vla_year: number | null;
  vin_code: string | null;
  chassis: string | null;
  condition: string;
  status: string;
  review_comment: string | null;
  created_by: number;
  reviewed_by: number | null;
  reviewed_at: Date | null;
  created_at: Date;

  manufacturer: string;
  model_name: string;

  category_id: number;
  category_name: string;

  branch_name: string | null;
  company_name: string | null;

  creator_username: string | null;
  reviewer_username: string | null;

  cover_photo_id: number | null;
  cover_photo_url: string | null;
  cover_photo_cloudinary_public_id: string | null;

  photos_count: number;
};

const vehicleDashboardInclude = {
  model: {
    include: {
      category: true,
    },
  },
  branch: {
    include: {
      company: true,
      city: {
        include: {
          county: true,
        },
      },
    },
  },
  creator: {
    select: {
      user_id: true,
      username: true,
      role: true,
    },
  },
  reviewer: {
    select: {
      user_id: true,
      username: true,
      role: true,
    },
  },
  photos: {
    orderBy: {
      created_at: "asc" as const,
    },
    take: 1,
    include: {
      city: {
        include: {
          county: true,
        },
      },
    },
  },
};

function mapPublicVehicleFromView(row: PublicVehicleViewRow) {
  const coverPhoto = row.cover_photo_id
    ? {
        photo_id: row.cover_photo_id,
        vehicle_id: row.vehicle_id,
        city_id: row.cover_photo_city_id,
        place: row.cover_photo_place,
        taken_at: row.cover_photo_taken_at,
        file_path: row.cover_photo_url,
        cloudinary_public_id: row.cover_photo_cloudinary_public_id,
        status: ReviewStatus.Kinnitatud,
        review_comment: null,
        reviewed_at: null,
        created_at: row.cover_photo_created_at,
        city: row.cover_photo_city_id
          ? {
              city_id: row.cover_photo_city_id,
              name: row.cover_photo_city_name,
              county: {
                county_id: row.cover_photo_county_id,
                name: row.cover_photo_county_name,
              },
            }
          : null,
      }
    : null;

  return {
    vehicle_id: row.vehicle_id,
    model_id: row.model_id,
    branch_id: row.branch_id,
    reg_number: row.reg_number,
    vla_year: row.vla_year,
    vin_code: row.vin_code,
    chassis: row.chassis,
    condition: row.condition as VehicleCondition,
    status: row.status as ReviewStatus,
    review_comment: null,
    created_by: row.creator_id,
    reviewed_by: null,
    reviewed_at: null,
    created_at: row.created_at,

    model: {
      model_id: row.model_id,
      manufacturer: row.manufacturer,
      name: row.model_name,
      category_id: row.category_id,
      category: {
        category_id: row.category_id,
        name: row.category_name,
      },
    },

    branch: row.branch_id
      ? {
          branch_id: row.branch_id,
          company_id: row.company_id,
          city_id: row.branch_city_id,
          branch_name: row.branch_name,
          company: row.company_id
            ? {
                company_id: row.company_id,
                name: row.company_name,
              }
            : null,
          city: row.branch_city_id
            ? {
                city_id: row.branch_city_id,
                name: row.branch_city_name,
                county: {
                  county_id: row.branch_county_id,
                  name: row.branch_county_name,
                },
              }
            : null,
        }
      : null,

    creator: row.creator_id
      ? {
          user_id: row.creator_id,
          username: row.creator_username,
        }
      : null,

    reviewer: null,
    photos: coverPhoto ? [coverPhoto] : [],
    confirmed_photos_count: row.confirmed_photos_count,
  };
}

function mapMyVehicleFromView(row: MyVehicleViewRow) {
  const coverPhoto = row.cover_photo_id
    ? {
        photo_id: row.cover_photo_id,
        vehicle_id: row.vehicle_id,
        file_path: row.cover_photo_url,
        cloudinary_public_id: row.cover_photo_cloudinary_public_id,
      }
    : null;

  return {
    vehicle_id: row.vehicle_id,
    model_id: row.model_id,
    branch_id: row.branch_id,
    reg_number: row.reg_number,
    vla_year: row.vla_year,
    vin_code: row.vin_code,
    chassis: row.chassis,
    condition: row.condition as VehicleCondition,
    status: row.status as ReviewStatus,
    review_comment: row.review_comment,
    created_by: row.created_by,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,

    model: {
      model_id: row.model_id,
      manufacturer: row.manufacturer,
      name: row.model_name,
      category_id: row.category_id,
      category: {
        category_id: row.category_id,
        name: row.category_name,
      },
    },

    branch: row.branch_id
      ? {
          branch_id: row.branch_id,
          branch_name: row.branch_name,
          company: row.company_name
            ? {
                name: row.company_name,
              }
            : null,
        }
      : null,

    creator: {
      user_id: row.created_by,
      username: row.creator_username,
    },

    reviewer: row.reviewed_by
      ? {
          user_id: row.reviewed_by,
          username: row.reviewer_username,
        }
      : null,

    photos: coverPhoto ? [coverPhoto] : [],
    photos_count: row.photos_count,
  };
}

function getPendingReviewData() {
  return {
    status: ReviewStatus.Ootel,
    reviewed_by: null,
    reviewed_at: null,
    review_comment: null,
  };
}

async function findOrCreatePendingCity(
  tx: Prisma.TransactionClient,
  data: {
    city_id?: number | null;
    name?: string | null;
    county_id?: number | null;
    user_id: number;
  }
) {
  if (data.city_id !== undefined && data.city_id !== null) {
    return data.city_id;
  }

  if (!data.name || !data.county_id) {
    return null;
  }

  const cityName = data.name.trim();

  if (!cityName) {
    throw new Error("city name is required");
  }

  const existingCity = await tx.cities.findFirst({
    where: {
      name: {
        equals: cityName,
        mode: "insensitive",
      },
    },
  });

  if (existingCity) {
    if (existingCity.status !== ReviewStatus.Kinnitatud) {
      await tx.cities.update({
        where: {
          city_id: existingCity.city_id,
        },
        data: getPendingReviewData(),
      });
    }

    return existingCity.city_id;
  }

  const city = await tx.cities.create({
    data: {
      name: cityName,
      county_id: data.county_id,
      status: ReviewStatus.Ootel,
      created_by: data.user_id,
      review_comment: null,
    },
  });

  return city.city_id;
}

async function resolveModelId(
  tx: Prisma.TransactionClient,
  data: CreateVehicleWithFirstPhotoData
) {
  if (data.model_id) {
    return data.model_id;
  }

  if (
    data.new_model_manufacturer &&
    data.new_model_name &&
    data.new_model_category_id
  ) {
    const manufacturer = data.new_model_manufacturer.trim();
    const modelName = data.new_model_name.trim();

    if (!manufacturer || !modelName) {
      throw new Error("model manufacturer and name are required");
    }

    const existingModel = await tx.models.findFirst({
      where: {
        manufacturer: {
          equals: manufacturer,
          mode: "insensitive",
        },
        name: {
          equals: modelName,
          mode: "insensitive",
        },
      },
    });

    if (existingModel) {
      if (existingModel.status !== ReviewStatus.Kinnitatud) {
        await tx.models.update({
          where: {
            model_id: existingModel.model_id,
          },
          data: getPendingReviewData(),
        });
      }

      return existingModel.model_id;
    }

    const model = await tx.models.create({
      data: {
        manufacturer,
        name: modelName,
        category_id: data.new_model_category_id,
        status: ReviewStatus.Ootel,
        created_by: data.user_id,
        review_comment: null,
      },
    });

    return model.model_id;
  }

  throw new Error("model_id or new model data is required");
}

async function resolveCompanyId(
  tx: Prisma.TransactionClient,
  data: {
    company_id?: number | null;

    new_company_name?: string | null;
    new_company_city_id?: number | null;
    new_company_city_name?: string | null;
    new_company_city_county_id?: number | null;

    user_id: number;
  }
) {
  if (data.company_id) {
    return data.company_id;
  }

  if (!data.new_company_name) {
    return null;
  }

  const companyName = data.new_company_name.trim();

  if (!companyName) {
    throw new Error("company name is required");
  }

  const existingCompany = await tx.companies.findFirst({
    where: {
      name: {
        equals: companyName,
        mode: "insensitive",
      },
    },
  });

  if (existingCompany) {
    if (existingCompany.status !== ReviewStatus.Kinnitatud) {
      await tx.companies.update({
        where: {
          company_id: existingCompany.company_id,
        },
        data: getPendingReviewData(),
      });
    }

    return existingCompany.company_id;
  }

  const companyCityId = await findOrCreatePendingCity(tx, {
    city_id: data.new_company_city_id,
    name: data.new_company_city_name,
    county_id: data.new_company_city_county_id,
    user_id: data.user_id,
  });

  if (!companyCityId) {
    throw new Error("company city is required");
  }

  const company = await tx.companies.create({
    data: {
      name: companyName,
      city_id: companyCityId,
      status: ReviewStatus.Ootel,
      created_by: data.user_id,
      review_comment: null,
    },
  });

  return company.company_id;
}

async function resolveBranchId(
  tx: Prisma.TransactionClient,
  data: CreateVehicleWithFirstPhotoData
) {
  if (data.branch_id) {
    return data.branch_id;
  }

  const hasNewBranchData =
    Boolean(data.new_branch_name) ||
    Boolean(data.new_branch_company_id) ||
    Boolean(data.new_company_name) ||
    Boolean(data.new_company_city_id) ||
    Boolean(data.new_company_city_name) ||
    Boolean(data.new_company_city_county_id) ||
    Boolean(data.new_branch_city_id) ||
    Boolean(data.new_branch_city_name) ||
    Boolean(data.new_branch_city_county_id);

  if (!hasNewBranchData) {
    return null;
  }

  const companyId = await resolveCompanyId(tx, {
    company_id: data.new_branch_company_id,
    new_company_name: data.new_company_name,
    new_company_city_id: data.new_company_city_id,
    new_company_city_name: data.new_company_city_name,
    new_company_city_county_id: data.new_company_city_county_id,
    user_id: data.user_id,
  });

  if (!companyId) {
    throw new Error("company is required for new branch");
  }

  const branchCityId = await findOrCreatePendingCity(tx, {
    city_id: data.new_branch_city_id,
    name: data.new_branch_city_name,
    county_id: data.new_branch_city_county_id,
    user_id: data.user_id,
  });

  if (!branchCityId) {
    throw new Error("branch city is required");
  }

  const branchName = data.new_branch_name?.trim() || "Peafiliaal";

  const existingBranch = await tx.company_branches.findFirst({
    where: {
      company_id: companyId,
      city_id: branchCityId,
      branch_name: {
        equals: branchName,
        mode: "insensitive",
      },
    },
  });

  if (existingBranch) {
    if (existingBranch.status !== ReviewStatus.Kinnitatud) {
      await tx.company_branches.update({
        where: {
          branch_id: existingBranch.branch_id,
        },
        data: getPendingReviewData(),
      });
    }

    return existingBranch.branch_id;
  }

  const branch = await tx.company_branches.create({
    data: {
      company_id: companyId,
      city_id: branchCityId,
      branch_name: branchName,
      status: ReviewStatus.Ootel,
      created_by: data.user_id,
      review_comment: null,
    },
  });

  return branch.branch_id;
}

async function resolveFirstPhotoCityId(
  tx: Prisma.TransactionClient,
  data: CreateVehicleWithFirstPhotoData
) {
  return findOrCreatePendingCity(tx, {
    city_id: data.city_id,
    name: data.new_city_name,
    county_id: data.new_city_county_id,
    user_id: data.user_id,
  });
}

async function resetVehicleReferencesToPending(
  tx: Prisma.TransactionClient,
  vehicleId: number
) {
  const vehicle = await tx.vehicles.findUnique({
    where: {
      vehicle_id: vehicleId,
    },
    select: {
      model_id: true,
      branch_id: true,
    },
  });

  if (!vehicle) {
    return;
  }

  const model = await tx.models.findUnique({
    where: {
      model_id: vehicle.model_id,
    },
    select: {
      status: true,
    },
  });

  if (model && model.status !== ReviewStatus.Kinnitatud) {
    await tx.models.update({
      where: {
        model_id: vehicle.model_id,
      },
      data: getPendingReviewData(),
    });
  }

  if (!vehicle.branch_id) {
    return;
  }

  const branch = await tx.company_branches.findUnique({
    where: {
      branch_id: vehicle.branch_id,
    },
    select: {
      status: true,
      company_id: true,
      city_id: true,
    },
  });

  if (!branch) {
    return;
  }

  if (branch.status !== ReviewStatus.Kinnitatud) {
    await tx.company_branches.update({
      where: {
        branch_id: vehicle.branch_id,
      },
      data: getPendingReviewData(),
    });
  }

  if (branch.company_id) {
    const company = await tx.companies.findUnique({
      where: {
        company_id: branch.company_id,
      },
      select: {
        status: true,
      },
    });

    if (company && company.status !== ReviewStatus.Kinnitatud) {
      await tx.companies.update({
        where: {
          company_id: branch.company_id,
        },
        data: getPendingReviewData(),
      });
    }
  }

  if (branch.city_id) {
    const city = await tx.cities.findUnique({
      where: {
        city_id: branch.city_id,
      },
      select: {
        status: true,
      },
    });

    if (city && city.status !== ReviewStatus.Kinnitatud) {
      await tx.cities.update({
        where: {
          city_id: branch.city_id,
        },
        data: getPendingReviewData(),
      });
    }
  }
}

async function resetFirstVehiclePhotoToPending(
  tx: Prisma.TransactionClient,
  vehicleId: number
) {
  const firstPhoto = await tx.photos.findFirst({
    where: {
      vehicle_id: vehicleId,
    },
    orderBy: {
      created_at: "asc",
    },
    select: {
      photo_id: true,
      city_id: true,
    },
  });

  if (!firstPhoto) {
    return;
  }

  if (firstPhoto.city_id) {
    const city = await tx.cities.findUnique({
      where: {
        city_id: firstPhoto.city_id,
      },
      select: {
        status: true,
      },
    });

    if (city && city.status !== ReviewStatus.Kinnitatud) {
      await tx.cities.update({
        where: {
          city_id: firstPhoto.city_id,
        },
        data: getPendingReviewData(),
      });
    }
  }

  await tx.photos.update({
    where: {
      photo_id: firstPhoto.photo_id,
    },
    data: getPendingReviewData(),
  });
}

export async function getPublicVehicles(params: GetPublicVehiclesParams) {
  const {
    page,
    limit,
    regNumber,
    cityId,
    countyId,
    categoryId,
    modelId,
    companyId,
    branchId,
    condition,
    createdFrom,
    createdTo,
  } = params;

  const skip = (page - 1) * limit;
  const filters: Prisma.Sql[] = [];

  if (regNumber) {
    filters.push(Prisma.sql`v.reg_number ILIKE ${`%${regNumber}%`}`);
  }

  if (modelId) {
    filters.push(Prisma.sql`v.model_id = ${modelId}`);
  }

  if (branchId) {
    filters.push(Prisma.sql`v.branch_id = ${branchId}`);
  }

  if (companyId) {
    filters.push(Prisma.sql`v.company_id = ${companyId}`);
  }

  if (categoryId) {
    filters.push(Prisma.sql`v.category_id = ${categoryId}`);
  }

  if (condition) {
    filters.push(Prisma.sql`v.condition = ${condition}`);
  }

  if (createdFrom) {
    filters.push(Prisma.sql`v.created_at >= ${createdFrom}`);
  }

  if (createdTo) {
    filters.push(Prisma.sql`v.created_at <= ${createdTo}`);
  }

  if (cityId || countyId) {
    const branchLocationFilters: Prisma.Sql[] = [];
    const photoLocationFilters: Prisma.Sql[] = [];

    if (cityId) {
      branchLocationFilters.push(Prisma.sql`v.branch_city_id = ${cityId}`);
      photoLocationFilters.push(Prisma.sql`p.city_id = ${cityId}`);
    }

    if (countyId) {
      branchLocationFilters.push(Prisma.sql`v.branch_county_id = ${countyId}`);
      photoLocationFilters.push(Prisma.sql`p.county_id = ${countyId}`);
    }

    filters.push(Prisma.sql`
      (
        (${Prisma.join(branchLocationFilters, " AND ")})
        OR EXISTS (
          SELECT 1
          FROM ${Prisma.raw(dbView("v_public_vehicle_photos"))} p
          WHERE p.vehicle_id = v.vehicle_id
            AND ${Prisma.join(photoLocationFilters, " AND ")}
        )
      )
    `);
  }

  const whereSql =
    filters.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
      : Prisma.empty;

  const items = await prisma.$queryRaw<PublicVehicleViewRow[]>`
    SELECT *
    FROM ${Prisma.raw(dbView("v_public_vehicles"))} v
    ${whereSql}
    ORDER BY v.created_at DESC, v.vehicle_id DESC
    OFFSET ${skip}
    LIMIT ${limit}
  `;

  const totalRows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*) AS total
    FROM ${Prisma.raw(dbView("v_public_vehicles"))} v
    ${whereSql}
  `;

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: items.map(mapPublicVehicleFromView),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getVehicleById(vehicleId: number) {
  const rows = await prisma.$queryRaw<PublicVehicleViewRow[]>`
    SELECT *
    FROM ${Prisma.raw(dbView("v_public_vehicles"))} v
    WHERE v.vehicle_id = ${vehicleId}
    LIMIT 1
  `;

  const vehicle = rows[0];

  if (!vehicle) {
    return null;
  }

  return mapPublicVehicleFromView(vehicle);
}

export async function getMyVehicles(params: GetMyVehiclesParams) {
  const {
    userId,
    page,
    limit,
    status,
    regNumber,
    cityId,
    countyId,
    categoryId,
    condition,
    createdFrom,
    createdTo,
  } = params;

  const skip = (page - 1) * limit;
  const filters: Prisma.Sql[] = [Prisma.sql`v.created_by = ${userId}`];

  if (status) {
    filters.push(Prisma.sql`v.status = ${status}`);
  }

  if (regNumber) {
    filters.push(Prisma.sql`v.reg_number ILIKE ${`%${regNumber}%`}`);
  }

  if (categoryId) {
    filters.push(Prisma.sql`v.category_id = ${categoryId}`);
  }

  if (condition) {
    filters.push(Prisma.sql`v.condition = ${condition}`);
  }

  if (createdFrom) {
    filters.push(Prisma.sql`v.created_at >= ${createdFrom}`);
  }

  if (createdTo) {
    filters.push(Prisma.sql`v.created_at <= ${createdTo}`);
  }

  if (cityId || countyId) {
    const photoLocationFilters: Prisma.Sql[] = [];

    if (cityId) {
      photoLocationFilters.push(Prisma.sql`p.city_id = ${cityId}`);
    }

    if (countyId) {
      photoLocationFilters.push(Prisma.sql`p.county_id = ${countyId}`);
    }

    filters.push(Prisma.sql`
      EXISTS (
        SELECT 1
        FROM ${Prisma.raw(dbView("v_my_photos"))} p
        WHERE p.vehicle_id = v.vehicle_id
          AND ${Prisma.join(photoLocationFilters, " AND ")}
      )
    `);
  }

  const whereSql = Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`;

  const items = await prisma.$queryRaw<MyVehicleViewRow[]>`
    SELECT *
    FROM ${Prisma.raw(dbView("v_my_vehicles"))} v
    ${whereSql}
    ORDER BY v.created_at DESC, v.vehicle_id DESC
    OFFSET ${skip}
    LIMIT ${limit}
  `;

  const totalRows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*) AS total
    FROM ${Prisma.raw(dbView("v_my_vehicles"))} v
    ${whereSql}
  `;

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: items.map(mapMyVehicleFromView),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMyVehicleById(vehicleId: number, userId: number) {
  return prisma.vehicles.findFirst({
    where: {
      vehicle_id: vehicleId,
      created_by: userId,
    },
    include: {
      model: {
        include: {
          category: true,
        },
      },
      branch: {
        include: {
          company: true,
          city: {
            include: {
              county: true,
            },
          },
        },
      },
      creator: {
        select: {
          user_id: true,
          username: true,
          role: true,
        },
      },
      reviewer: {
        select: {
          user_id: true,
          username: true,
          role: true,
        },
      },
      photos: {
        orderBy: {
          created_at: "asc",
        },
        include: {
          author: {
            select: {
              user_id: true,
              username: true,
              role: true,
            },
          },
          city: {
            include: {
              county: true,
            },
          },
        },
      },
    },
  });
}

export async function createVehicleWithFirstPhoto(
  data: CreateVehicleWithFirstPhotoData
) {
  return prisma.$transaction(async (tx) => {
    const regNumber = data.reg_number.trim();

    const existingVehicle = await tx.vehicles.findFirst({
      where: {
        reg_number: {
          equals: regNumber,
          mode: "insensitive",
        },
      },
      select: {
        vehicle_id: true,
      },
    });

    if (existingVehicle) {
      throw new Error("Vehicle with this registration number already exists");
    }

    const modelId = await resolveModelId(tx, data);
    const branchId = await resolveBranchId(tx, data);
    const photoCityId = await resolveFirstPhotoCityId(tx, data);

    const vehicle = await tx.vehicles.create({
      data: {
        model_id: modelId,
        branch_id: branchId,
        reg_number: regNumber,
        vla_year: data.vla_year ?? null,
        vin_code: data.vin_code ?? null,
        chassis: data.chassis ?? null,
        condition: data.condition ?? "Teadmata",
        status: ReviewStatus.Ootel,
        created_by: data.user_id,
        review_comment: null,
      },
    });

    const photo = await tx.photos.create({
      data: {
        vehicle_id: vehicle.vehicle_id,
        author_id: data.user_id,
        city_id: photoCityId,
        place: data.place ?? null,
        taken_at: data.taken_at ? new Date(data.taken_at) : null,
        file_path: data.file_path,
        cloudinary_public_id: data.cloudinary_public_id ?? null,
        status: ReviewStatus.Ootel,
        review_comment: null,
      },
    });

    return {
      vehicle,
      photo,
    };
  });
}

export async function getVehicleForEdit(vehicleId: number) {
  return prisma.vehicles.findUnique({
    where: {
      vehicle_id: vehicleId,
    },
  });
}

export async function updateVehicle(vehicleId: number, data: UpdateVehicleData) {
  return prisma.$transaction(async (tx) => {
    const currentVehicle = await tx.vehicles.findUnique({
      where: {
        vehicle_id: vehicleId,
      },
    });

    if (!currentVehicle) {
      return null;
    }

    if (currentVehicle.status === ReviewStatus.Kinnitatud) {
      throw new Error("Kinnitatud sõidukit ei saa muuta.");
    }

    const nextRegNumber = data.reg_number?.trim();

    if (nextRegNumber) {
      const existingVehicle = await tx.vehicles.findFirst({
        where: {
          reg_number: {
            equals: nextRegNumber,
            mode: "insensitive",
          },
          NOT: {
            vehicle_id: vehicleId,
          },
        },
        select: {
          vehicle_id: true,
        },
      });

      if (existingVehicle) {
        throw new Error("Vehicle with this registration number already exists");
      }
    }

    let nextModelId: number | undefined;

    if (
      data.new_model_manufacturer &&
      data.new_model_name &&
      data.new_model_category_id
    ) {
      nextModelId = await resolveModelId(tx, {
        model_id: null,
        new_model_manufacturer: data.new_model_manufacturer,
        new_model_name: data.new_model_name,
        new_model_category_id: data.new_model_category_id,
        reg_number: currentVehicle.reg_number,
        file_path: "",
        user_id: data.user_id,
      });
    } else if (data.model_id) {
      nextModelId = data.model_id;
    }

    let nextBranchId: number | null | undefined;

    const hasNewBranchData =
      Boolean(data.new_branch_name) ||
      Boolean(data.new_branch_company_id) ||
      Boolean(data.new_company_name) ||
      Boolean(data.new_company_city_id) ||
      Boolean(data.new_company_city_name) ||
      Boolean(data.new_company_city_county_id) ||
      Boolean(data.new_branch_city_id) ||
      Boolean(data.new_branch_city_name) ||
      Boolean(data.new_branch_city_county_id);

    if (hasNewBranchData) {
      nextBranchId = await resolveBranchId(tx, {
        model_id: currentVehicle.model_id,
        branch_id: null,
        new_branch_name: data.new_branch_name,
        new_branch_company_id: data.new_branch_company_id,
        new_company_name: data.new_company_name,
        new_company_city_id: data.new_company_city_id,
        new_company_city_name: data.new_company_city_name,
        new_company_city_county_id: data.new_company_city_county_id,
        new_branch_city_id: data.new_branch_city_id,
        new_branch_city_name: data.new_branch_city_name,
        new_branch_city_county_id: data.new_branch_city_county_id,
        reg_number: currentVehicle.reg_number,
        file_path: "",
        user_id: data.user_id,
      });
    } else if (data.branch_id !== undefined) {
      nextBranchId = data.branch_id;
    }

    const updatedVehicle = await tx.vehicles.update({
      where: {
        vehicle_id: vehicleId,
      },
      data: {
        ...(nextModelId !== undefined ? { model_id: nextModelId } : {}),
        ...(nextBranchId !== undefined ? { branch_id: nextBranchId } : {}),
        ...(data.reg_number !== undefined
          ? { reg_number: data.reg_number.trim() }
          : {}),
        ...(data.vla_year !== undefined ? { vla_year: data.vla_year } : {}),
        ...(data.vin_code !== undefined ? { vin_code: data.vin_code } : {}),
        ...(data.chassis !== undefined ? { chassis: data.chassis } : {}),
        ...(data.condition !== undefined ? { condition: data.condition } : {}),
        ...getPendingReviewData(),
      },
    });

    await resetVehicleReferencesToPending(tx, vehicleId);
    await resetFirstVehiclePhotoToPending(tx, vehicleId);

    await cleanupUnusedVehicleReferences(tx, {
      model_id: currentVehicle.model_id,
      branch_id: currentVehicle.branch_id,
      photo_city_ids: [],
    });

    return updatedVehicle;
  });
}

export async function deleteVehicle(vehicleId: number) {
  const vehicle = await prisma.vehicles.findUnique({
    where: {
      vehicle_id: vehicleId,
    },
    include: {
      photos: true,
    },
  });

  if (!vehicle) {
    return null;
  }

  if (vehicle.status === ReviewStatus.Kinnitatud) {
    throw new Error("Kinnitatud sõidukit ei saa kustutada");
  }

  await prisma.$transaction(async (tx) => {
    await tx.photos.deleteMany({
      where: {
        vehicle_id: vehicleId,
      },
    });

    await tx.vehicles.delete({
      where: {
        vehicle_id: vehicleId,
      },
    });

    await cleanupUnusedVehicleReferences(tx, {
      model_id: vehicle.model_id,
      branch_id: vehicle.branch_id,
      photo_city_ids: vehicle.photos.map((photo) => photo.city_id),
    });
  });

  for (const photo of vehicle.photos) {
    if (!photo.cloudinary_public_id) {
      continue;
    }

    try {
      await deleteCloudinaryImage(photo.cloudinary_public_id);
    } catch (error) {
      console.error("Failed to delete Cloudinary image:", error);
    }
  }

  return vehicle;
}

export async function getPendingVehicles(params: {
  page: number;
  limit: number;
}) {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const where = {
    status: ReviewStatus.Ootel,
  };

  const items = await prisma.vehicles.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      created_at: "asc",
    },
    include: vehicleDashboardInclude,
  });

  const total = await prisma.vehicles.count({ where });

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
