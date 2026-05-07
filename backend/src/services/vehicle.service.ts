import prisma from "../config/prisma.js";
import {
  Prisma,
  ReviewStatus,
  type VehicleCondition,
} from "../generated/prisma/client.js";
import type { UpdateVehicleBody } from "../types/vehicle.js";
import { dbView } from "../utils/dbView.js";

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
}

interface CreateVehicleWithFirstPhotoData {
  model_id: number;
  branch_id?: number | null;
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
  city_id: number;
  place: string;
  taken_at?: string | null;
  file_path: string;
  cloudinary_public_id?: string | null;
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
      branchLocationFilters.push(
        Prisma.sql`v.branch_county_id = ${countyId}`
      );
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

  const [items, totalRows] = await Promise.all([
    prisma.$queryRaw<PublicVehicleViewRow[]>`
      SELECT *
      FROM ${Prisma.raw(dbView("v_public_vehicles"))} v
      ${whereSql}
      ORDER BY v.created_at DESC, v.vehicle_id DESC
      OFFSET ${skip}
      LIMIT ${limit}
    `,

    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS total
      FROM ${Prisma.raw(dbView("v_public_vehicles"))} v
      ${whereSql}
    `,
  ]);

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
  const { userId, page, limit, status } = params;
  const skip = (page - 1) * limit;

  const filters: Prisma.Sql[] = [Prisma.sql`v.created_by = ${userId}`];

  if (status) {
    filters.push(Prisma.sql`v.status = ${status}`);
  }

  const whereSql = Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`;

  const [items, totalRows] = await Promise.all([
    prisma.$queryRaw<MyVehicleViewRow[]>`
      SELECT *
      FROM ${Prisma.raw(dbView("v_my_vehicles"))} v
      ${whereSql}
      ORDER BY v.created_at DESC, v.vehicle_id DESC
      OFFSET ${skip}
      LIMIT ${limit}
    `,

    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS total
      FROM ${Prisma.raw(dbView("v_my_vehicles"))} v
      ${whereSql}
    `,
  ]);

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
    const vehicle = await tx.vehicles.create({
      data: {
        model_id: data.model_id,
        branch_id: data.branch_id ?? null,
        reg_number: data.reg_number,
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
        city_id: data.city_id,
        place: data.place,
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

export async function updateVehicle(vehicleId: number, data: UpdateVehicleBody) {
  return prisma.vehicles.update({
    where: {
      vehicle_id: vehicleId,
    },
    data: {
      ...(data.model_id !== undefined ? { model_id: data.model_id } : {}),
      ...(data.branch_id !== undefined ? { branch_id: data.branch_id } : {}),
      ...(data.reg_number !== undefined ? { reg_number: data.reg_number } : {}),
      ...(data.vla_year !== undefined ? { vla_year: data.vla_year } : {}),
      ...(data.vin_code !== undefined ? { vin_code: data.vin_code } : {}),
      ...(data.chassis !== undefined ? { chassis: data.chassis } : {}),
      ...(data.condition !== undefined ? { condition: data.condition } : {}),
    },
  });
}

export async function deleteVehicle(vehicleId: number) {
  return prisma.vehicles.delete({
    where: {
      vehicle_id: vehicleId,
    },
  });
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

  const [items, total] = await Promise.all([
    prisma.vehicles.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        created_at: "asc",
      },
      include: vehicleDashboardInclude,
    }),
    prisma.vehicles.count({ where }),
  ]);

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

export async function approveVehicle(vehicleId: number, reviewerId: number) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicles.update({
      where: {
        vehicle_id: vehicleId,
      },
      data: {
        status: ReviewStatus.Kinnitatud,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        review_comment: null,
      },
    });

    const firstPhoto = await tx.photos.findFirst({
      where: {
        vehicle_id: vehicleId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    if (firstPhoto) {
      await tx.photos.update({
        where: {
          photo_id: firstPhoto.photo_id,
        },
        data: {
          status: ReviewStatus.Kinnitatud,
          reviewed_at: new Date(),
          review_comment: null,
        },
      });
    }

    return vehicle;
  });
}

export async function rejectVehicle(
  vehicleId: number,
  reviewerId: number,
  reviewComment: string
) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicles.update({
      where: {
        vehicle_id: vehicleId,
      },
      data: {
        status: ReviewStatus.Tagasi_lukatud,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        review_comment: reviewComment,
      },
    });

    const firstPhoto = await tx.photos.findFirst({
      where: {
        vehicle_id: vehicleId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    if (firstPhoto) {
      await tx.photos.update({
        where: {
          photo_id: firstPhoto.photo_id,
        },
        data: {
          status: ReviewStatus.Tagasi_lukatud,
          reviewed_at: new Date(),
          review_comment: reviewComment,
        },
      });
    }

    return vehicle;
  });
}