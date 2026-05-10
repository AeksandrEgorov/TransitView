import prisma from "../config/prisma.js";
import {
  Prisma,
  ReviewStatus,
  type VehicleCondition,
} from "../generated/prisma/client.js";
import { dbView } from "../utils/dbView.js";
import { deleteVehicle, updateVehicle } from "./vehicle.service.js";

interface GetManageVehiclesParams {
  page: number;
  limit: number;

  status?: ReviewStatus;
  regNumber?: string;

  createdBy?: number;
  creatorId?: number;

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
  condition?: VehicleCondition;

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
  model_status: string;
  model_review_comment: string | null;

  category_id: number;
  category_name: string;

  branch_name: string | null;
  branch_status: string | null;
  branch_review_comment: string | null;

  company_name: string | null;
  company_status: string | null;
  company_review_comment: string | null;

  creator_username: string | null;
  reviewer_username: string | null;

  photos_total: number;
  photos_pending: number;
  photos_confirmed: number;
  photos_rejected: number;

  cover_photo_id: number | null;
  cover_photo_city_id: number | null;
  cover_photo_place: string | null;
  cover_photo_taken_at: Date | null;
  cover_photo_file_path: string | null;
  cover_photo_cloudinary_public_id: string | null;
  cover_photo_status: string | null;
  cover_photo_review_comment: string | null;
  cover_photo_created_at: Date | null;
  cover_photo_city_name: string | null;
  cover_photo_county_id: number | null;
  cover_photo_county_name: string | null;
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
      email: true,
      role: true,
    },
  },
  reviewer: {
    select: {
      user_id: true,
      username: true,
      email: true,
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
          email: true,
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
        place: row.cover_photo_place,
        taken_at: row.cover_photo_taken_at,
        file_path: row.cover_photo_file_path,
        cloudinary_public_id: row.cover_photo_cloudinary_public_id,
        status: row.cover_photo_status as ReviewStatus,
        review_comment: row.cover_photo_review_comment,
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
      status: row.model_status as ReviewStatus,
      review_comment: row.model_review_comment,
      category: {
        category_id: row.category_id,
        name: row.category_name,
      },
    },

    branch: row.branch_id
      ? {
          branch_id: row.branch_id,
          branch_name: row.branch_name,
          status: row.branch_status as ReviewStatus,
          review_comment: row.branch_review_comment,
          company: row.company_name
            ? {
                name: row.company_name,
                status: row.company_status as ReviewStatus,
                review_comment: row.company_review_comment,
              }
            : null,
          city: null,
        }
      : null,

    creator: row.created_by
      ? {
          user_id: row.created_by,
          username: row.creator_username,
        }
      : null,

    reviewer: row.reviewed_by
      ? {
          user_id: row.reviewed_by,
          username: row.reviewer_username,
        }
      : null,

    photos: coverPhoto ? [coverPhoto] : [],

    photos_count: row.photos_total,
    total_photos_count: row.photos_total,
    pending_photos_count: row.photos_pending,
    confirmed_photos_count: row.photos_confirmed,
    rejected_photos_count: row.photos_rejected,
  };
}

function getVehicleReviewData(params: {
  status: ReviewStatus;
  reviewerId: number;
  reviewComment?: string;
}) {
  if (params.status === ReviewStatus.Kinnitatud) {
    return {
      status: ReviewStatus.Kinnitatud,
      reviewed_by: params.reviewerId,
      reviewed_at: new Date(),
      review_comment: null,
    };
  }

  if (!params.reviewComment || !params.reviewComment.trim()) {
    throw new Error("Reject comment is required");
  }

  return {
    status: ReviewStatus.Tagasi_lukatud,
    reviewed_by: params.reviewerId,
    reviewed_at: new Date(),
    review_comment: params.reviewComment.trim(),
  };
}

function getPhotoReviewData(params: {
  status: ReviewStatus;
  reviewerId: number;
  reviewComment?: string;
}) {
  if (params.status === ReviewStatus.Kinnitatud) {
    return {
      status: ReviewStatus.Kinnitatud,
      reviewed_by: params.reviewerId,
      reviewed_at: new Date(),
      review_comment: null,
    };
  }

  if (!params.reviewComment || !params.reviewComment.trim()) {
    throw new Error("Reject comment is required");
  }

  return {
    status: ReviewStatus.Tagasi_lukatud,
    reviewed_by: params.reviewerId,
    reviewed_at: new Date(),
    review_comment: params.reviewComment.trim(),
  };
}

async function setVehicleRelatedReferencesStatus(
  tx: Prisma.TransactionClient,
  vehicleId: number,
  status: ReviewStatus,
  reviewerId: number,
  reviewComment?: string
) {
  const vehicle = await tx.vehicles.findUnique({
    where: {
      vehicle_id: vehicleId,
    },
    include: {
      model: true,
      branch: {
        include: {
          company: true,
          city: true,
        },
      },
    },
  });

  if (!vehicle) {
    return;
  }

  const reviewData = getVehicleReviewData({
    status,
    reviewerId,
    reviewComment,
  });

  if (vehicle.model.status !== ReviewStatus.Kinnitatud) {
    await tx.models.update({
      where: {
        model_id: vehicle.model_id,
      },
      data: reviewData,
    });
  }

  if (vehicle.branch && vehicle.branch.status !== ReviewStatus.Kinnitatud) {
    await tx.company_branches.update({
      where: {
        branch_id: vehicle.branch.branch_id,
      },
      data: reviewData,
    });
  }

  if (
    vehicle.branch?.company &&
    vehicle.branch.company.status !== ReviewStatus.Kinnitatud
  ) {
    await tx.companies.update({
      where: {
        company_id: vehicle.branch.company.company_id,
      },
      data: reviewData,
    });
  }

  if (
    vehicle.branch?.city &&
    vehicle.branch.city.status !== ReviewStatus.Kinnitatud
  ) {
    await tx.cities.update({
      where: {
        city_id: vehicle.branch.city.city_id,
      },
      data: reviewData,
    });
  }
}

async function setFirstVehiclePhotoStatus(
  tx: Prisma.TransactionClient,
  vehicleId: number,
  status: ReviewStatus,
  reviewerId: number,
  reviewComment?: string
) {
  const firstPhoto = await tx.photos.findFirst({
    where: {
      vehicle_id: vehicleId,
    },
    orderBy: {
      created_at: "asc",
    },
    include: {
      city: true,
    },
  });

  if (!firstPhoto) {
    return;
  }

  const reviewData =
    status === ReviewStatus.Kinnitatud
      ? {
          status: ReviewStatus.Kinnitatud,
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          review_comment: null,
        }
      : {
          status: ReviewStatus.Tagasi_lukatud,
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          review_comment: reviewComment?.trim() || null,
        };

  if (firstPhoto.city && firstPhoto.city.status !== ReviewStatus.Kinnitatud) {
    await tx.cities.update({
      where: {
        city_id: firstPhoto.city.city_id,
      },
      data: reviewData,
    });
  }

  await tx.photos.update({
    where: {
      photo_id: firstPhoto.photo_id,
    },
    data: reviewData,
  });
}

export async function getManageVehicles(params: GetManageVehiclesParams) {
  const {
    page,
    limit,
    status,
    regNumber,
    createdBy,
    creatorId,
    cityId,
    countyId,
    categoryId,
    modelId,
    branchId,
    condition,
    createdFrom,
    createdTo,
  } = params;

  const skip = (page - 1) * limit;
  const filters: Prisma.Sql[] = [];
  const authorId = createdBy ?? creatorId;

  if (status) {
    filters.push(Prisma.sql`v.status = ${status}`);
  }

  if (regNumber) {
    filters.push(Prisma.sql`v.reg_number ILIKE ${`%${regNumber}%`}`);
  }

  if (authorId) {
    filters.push(Prisma.sql`v.created_by = ${authorId}`);
  }

  if (modelId) {
    filters.push(Prisma.sql`v.model_id = ${modelId}`);
  }

  if (branchId) {
    filters.push(Prisma.sql`v.branch_id = ${branchId}`);
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
        FROM ${Prisma.raw(dbView("v_manage_photos"))} p
        WHERE p.vehicle_id = v.vehicle_id
          AND ${Prisma.join(photoLocationFilters, " AND ")}
      )
    `);
  }

  const whereSql =
    filters.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
      : Prisma.empty;

  const [items, totalRows] = await Promise.all([
    prisma.$queryRaw<ManageVehicleViewRow[]>`
      SELECT
        v.*,

        cover_photo.photo_id AS cover_photo_id,
        cover_photo.city_id AS cover_photo_city_id,
        cover_photo.place AS cover_photo_place,
        cover_photo.taken_at AS cover_photo_taken_at,
        cover_photo.file_path AS cover_photo_file_path,
        cover_photo.cloudinary_public_id AS cover_photo_cloudinary_public_id,
        cover_photo.status AS cover_photo_status,
        cover_photo.review_comment AS cover_photo_review_comment,
        cover_photo.created_at AS cover_photo_created_at,
        cover_photo.city_name AS cover_photo_city_name,
        cover_photo.county_id AS cover_photo_county_id,
        cover_photo.county_name AS cover_photo_county_name

      FROM ${Prisma.raw(dbView("v_manage_vehicles"))} v

      LEFT JOIN LATERAL (
        SELECT p.*
        FROM ${Prisma.raw(dbView("v_manage_photos"))} p
        WHERE p.vehicle_id = v.vehicle_id
        ORDER BY p.created_at ASC, p.photo_id ASC
        LIMIT 1
      ) cover_photo ON TRUE

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
  return updateVehicle(vehicleId, {
    model_id: data.model_id,
    new_model_manufacturer: data.new_model_manufacturer,
    new_model_name: data.new_model_name,
    new_model_category_id: data.new_model_category_id,

    branch_id: data.branch_id,
    new_branch_name: data.new_branch_name,

    new_branch_company_id: data.new_branch_company_id,

    new_company_name: data.new_company_name,
    new_company_city_id: data.new_company_city_id,
    new_company_city_name: data.new_company_city_name,
    new_company_city_county_id: data.new_company_city_county_id,

    new_branch_city_id: data.new_branch_city_id,
    new_branch_city_name: data.new_branch_city_name,
    new_branch_city_county_id: data.new_branch_city_county_id,

    reg_number: data.reg_number,
    vla_year: data.vla_year,
    vin_code: data.vin_code,
    chassis: data.chassis,
    condition: data.condition,

    user_id: data.actor_id,
  });
}

export async function deleteManageVehicle(vehicleId: number) {
  return deleteVehicle(vehicleId);
}

export async function approveManageVehicle(
  vehicleId: number,
  reviewerId: number
) {
  return prisma.$transaction(async (tx) => {
    await setVehicleRelatedReferencesStatus(
      tx,
      vehicleId,
      ReviewStatus.Kinnitatud,
      reviewerId
    );

    const vehicle = await tx.vehicles.update({
      where: {
        vehicle_id: vehicleId,
      },
      data: getVehicleReviewData({
        status: ReviewStatus.Kinnitatud,
        reviewerId,
      }),
    });

    await setFirstVehiclePhotoStatus(
      tx,
      vehicleId,
      ReviewStatus.Kinnitatud,
      reviewerId
    );

    return vehicle;
  });
}

export async function rejectManageVehicle(
  vehicleId: number,
  reviewerId: number,
  reviewComment: string
) {
  return prisma.$transaction(async (tx) => {
    await setVehicleRelatedReferencesStatus(
      tx,
      vehicleId,
      ReviewStatus.Tagasi_lukatud,
      reviewerId,
      reviewComment
    );

    const vehicle = await tx.vehicles.update({
      where: {
        vehicle_id: vehicleId,
      },
      data: getVehicleReviewData({
        status: ReviewStatus.Tagasi_lukatud,
        reviewerId,
        reviewComment,
      }),
    });

    await setFirstVehiclePhotoStatus(
      tx,
      vehicleId,
      ReviewStatus.Tagasi_lukatud,
      reviewerId,
      reviewComment
    );

    return vehicle;
  });
}

export async function pendingManageVehicle(vehicleId: number) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicles.update({
      where: {
        vehicle_id: vehicleId,
      },
      data: {
        status: ReviewStatus.Ootel,
        reviewed_by: null,
        reviewed_at: null,
        review_comment: null,
      },
      include: manageVehicleDetailInclude,
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
          status: ReviewStatus.Ootel,
          reviewed_by: null,
          reviewed_at: null,
          review_comment: null,
        },
      });
    }

    return vehicle;
  });
}