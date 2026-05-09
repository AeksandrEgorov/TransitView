import prisma from "../config/prisma.js";
import {
  Prisma,
  ReviewStatus,
  type UserRole,
  type VehicleCondition,
} from "../generated/prisma/client.js";
import { dbView } from "../utils/dbView.js";
import { deleteCloudinaryImage } from "../utils/uploadToCloudinary.js";
import { cleanupUnusedVehicleReferences } from "./referenceCleanup.service.js";

interface GetManageVehiclesParams {
  page: number;
  limit: number;

  status?: ReviewStatus;
  regNumber?: string;

  createdBy?: number;

  cityId?: number;
  countyId?: number;
  categoryId?: number;
  modelId?: number;
  companyId?: number;
  branchId?: number;

  condition?: VehicleCondition;

  createdFrom?: Date;
  createdTo?: Date;
}

interface UpdateManageVehicleData {
  model_id?: number;
  branch_id?: number | null;
  reg_number?: string;
  vla_year?: number | null;
  vin_code?: string | null;
  chassis?: string | null;
  condition?: VehicleCondition;
  status?: ReviewStatus;
  review_comment?: string | null;
  actor_id: number;
}

type CountRow = {
  total: bigint | number;
};

type ManageVehicleViewRow = {
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
  created_by: number | null;
  reviewed_by: number | null;
  reviewed_at: Date | null;
  created_at: Date;

  manufacturer: string;
  model_name: string;

  category_id: number;
  category_name: string;

  branch_name: string | null;

  company_id: number | null;
  company_name: string | null;

  branch_city_id: number | null;
  branch_city_name: string | null;

  branch_county_id: number | null;
  branch_county_name: string | null;

  creator_username: string | null;
  creator_role: string | null;

  reviewer_username: string | null;
  reviewer_role: string | null;

  cover_photo_id: number | null;
  cover_photo_url: string | null;
  cover_photo_cloudinary_public_id: string | null;
  cover_photo_status: string | null;
  cover_photo_city_id: number | null;
  cover_photo_city_name: string | null;
  cover_photo_county_id: number | null;
  cover_photo_county_name: string | null;

  total_photos_count: number;
  pending_photos_count: number;
  confirmed_photos_count: number;
  rejected_photos_count: number;
};

const manageVehicleDetailInclude = {
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
};

function mapManageVehicleFromView(row: ManageVehicleViewRow) {
  const coverPhoto = row.cover_photo_id
    ? {
        photo_id: row.cover_photo_id,
        vehicle_id: row.vehicle_id,
        city_id: row.cover_photo_city_id,
        file_path: row.cover_photo_url,
        cloudinary_public_id: row.cover_photo_cloudinary_public_id,
        status: row.cover_photo_status as ReviewStatus,
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

    creator: row.created_by
      ? {
          user_id: row.created_by,
          username: row.creator_username,
          role: row.creator_role as UserRole,
        }
      : null,

    reviewer: row.reviewed_by
      ? {
          user_id: row.reviewed_by,
          username: row.reviewer_username,
          role: row.reviewer_role as UserRole,
        }
      : null,

    photos: coverPhoto ? [coverPhoto] : [],

    total_photos_count: row.total_photos_count,
    pending_photos_count: row.pending_photos_count,
    confirmed_photos_count: row.confirmed_photos_count,
    rejected_photos_count: row.rejected_photos_count,
  };
}

function buildVehicleModerationData(params: {
  status?: ReviewStatus;
  reviewComment?: string | null;
  actorId: number;
}): Prisma.VehiclesUncheckedUpdateInput {
  const { status, reviewComment, actorId } = params;

  if (!status) {
    return reviewComment !== undefined
      ? {
          review_comment: reviewComment,
        }
      : {};
  }

  if (status === ReviewStatus.Ootel) {
    return {
      status,
      reviewed_by: null,
      reviewed_at: null,
      review_comment: null,
    };
  }

  if (status === ReviewStatus.Kinnitatud) {
    return {
      status,
      reviewed_by: actorId,
      reviewed_at: new Date(),
      review_comment: null,
    };
  }

  if (!reviewComment || !reviewComment.trim()) {
    throw new Error("Reject comment is required");
  }

  return {
    status,
    reviewed_by: actorId,
    reviewed_at: new Date(),
    review_comment: reviewComment.trim(),
  };
}

export async function getManageVehicles(params: GetManageVehiclesParams) {
  const {
    page,
    limit,
    status,
    regNumber,
    createdBy,
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

  if (status) {
    filters.push(Prisma.sql`v.status = ${status}`);
  }

  if (regNumber) {
    filters.push(Prisma.sql`v.reg_number ILIKE ${`%${regNumber}%`}`);
  }

  if (createdBy) {
    filters.push(Prisma.sql`v.created_by = ${createdBy}`);
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
          FROM ${Prisma.raw(dbView("v_manage_photos"))} p
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
    prisma.$queryRaw<ManageVehicleViewRow[]>`
      SELECT *
      FROM ${Prisma.raw(dbView("v_manage_vehicles"))} v
      ${whereSql}
      ORDER BY v.created_at DESC, v.vehicle_id DESC
      OFFSET ${skip}
      LIMIT ${limit}
    `,

    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS total
      FROM ${Prisma.raw(dbView("v_manage_vehicles"))} v
      ${whereSql}
    `,
  ]);

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: items.map(mapManageVehicleFromView),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getManageVehicleById(vehicleId: number) {
  return prisma.vehicles.findUnique({
    where: {
      vehicle_id: vehicleId,
    },
    include: manageVehicleDetailInclude,
  });
}

export async function updateManageVehicle(
  vehicleId: number,
  data: UpdateManageVehicleData
) {
  const moderationData = buildVehicleModerationData({
    status: data.status,
    reviewComment: data.review_comment,
    actorId: data.actor_id,
  });

  const updateData: Prisma.VehiclesUncheckedUpdateInput = {
    ...(data.model_id !== undefined ? { model_id: data.model_id } : {}),
    ...(data.branch_id !== undefined ? { branch_id: data.branch_id } : {}),
    ...(data.reg_number !== undefined ? { reg_number: data.reg_number } : {}),
    ...(data.vla_year !== undefined ? { vla_year: data.vla_year } : {}),
    ...(data.vin_code !== undefined ? { vin_code: data.vin_code } : {}),
    ...(data.chassis !== undefined ? { chassis: data.chassis } : {}),
    ...(data.condition !== undefined ? { condition: data.condition } : {}),
    ...moderationData,
  };

  return prisma.vehicles.update({
    where: {
      vehicle_id: vehicleId,
    },
    data: updateData,
    include: manageVehicleDetailInclude,
  });
}

export async function deleteManageVehicle(vehicleId: number) {
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

export async function approveManageVehicle(
  vehicleId: number,
  reviewerId: number
) {
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

export async function rejectManageVehicle(
  vehicleId: number,
  reviewerId: number,
  reviewComment: string
) {
  if (!reviewComment || !reviewComment.trim()) {
    throw new Error("Reject comment is required");
  }

  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicles.update({
      where: {
        vehicle_id: vehicleId,
      },
      data: {
        status: ReviewStatus.Tagasi_lukatud,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        review_comment: reviewComment.trim(),
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
          review_comment: reviewComment.trim(),
        },
      });
    }

    return vehicle;
  });
}