// This service contains editor/admin photo moderation logic.
// It reads manage photo views and updates photo review status with related city status when needed.

import prisma from "../config/prisma.js";
import {
  Prisma,
  ReviewStatus,
  type UserRole,
  type VehicleCondition,
} from "../generated/prisma/client.js";
import { dbView } from "../utils/dbView.js";

interface GetManagePhotosParams {
  page: number;
  limit: number;
  status?: ReviewStatus;
  regNumber?: string;
  cityId?: number;
  countyId?: number;
  vehicleId?: number;
  authorId?: number;
  vehicleCreatorId?: number;
  categoryId?: number;
  condition?: VehicleCondition;
  createdFrom?: Date;
  createdTo?: Date;
}

type CountRow = {
  total: bigint | number;
};

type ReviewData = {
  status: ReviewStatus;
  reviewed_by?: number | null;
  reviewed_at: Date | null;
  review_comment: string | null;
};

type ManagePhotoViewRow = {
  photo_id: number;
  vehicle_id: number;
  author_id: number | null;
  city_id: number | null;
  place: string | null;
  taken_at: Date | null;
  file_path: string;
  cloudinary_public_id: string | null;
  status: string;
  review_comment: string | null;
  reviewed_at: Date | null;
  created_at: Date;

  reg_number: string;
  vehicle_status: string;
  vehicle_condition: string;
  vehicle_created_by: number | null;

  model_id: number;
  manufacturer: string;
  model_name: string;

  category_id: number;
  category_name: string;

  city_name: string | null;
  county_id: number | null;
  county_name: string | null;

  branch_id: number | null;
  branch_name: string | null;

  company_id: number | null;
  company_name: string | null;

  branch_city_id: number | null;
  branch_city_name: string | null;

  branch_county_id: number | null;
  branch_county_name: string | null;

  author_username: string | null;
  author_role: string | null;

  vehicle_creator_username: string | null;
  vehicle_creator_role: string | null;
};

const managePhotoDetailInclude = {
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
  vehicle: {
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
    },
  },
};

function mapManagePhotoFromView(row: ManagePhotoViewRow) {
  return {
    photo_id: row.photo_id,
    vehicle_id: row.vehicle_id,
    author_id: row.author_id,
    city_id: row.city_id,
    place: row.place,
    taken_at: row.taken_at,
    file_path: row.file_path,
    cloudinary_public_id: row.cloudinary_public_id,
    status: row.status as ReviewStatus,
    review_comment: row.review_comment,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,

    author: row.author_id
      ? {
          user_id: row.author_id,
          username: row.author_username,
          role: row.author_role as UserRole,
        }
      : null,

    city: row.city_id
      ? {
          city_id: row.city_id,
          name: row.city_name,
          county: {
            county_id: row.county_id,
            name: row.county_name,
          },
        }
      : null,

    vehicle: {
      vehicle_id: row.vehicle_id,
      reg_number: row.reg_number,
      status: row.vehicle_status as ReviewStatus,
      condition: row.vehicle_condition as VehicleCondition,
      created_by: row.vehicle_created_by,

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

      creator: row.vehicle_created_by
        ? {
            user_id: row.vehicle_created_by,
            username: row.vehicle_creator_username,
            role: row.vehicle_creator_role as UserRole,
          }
        : null,
    },
  };
}

function getPhotoApproveData(reviewerId?: number): ReviewData {
  return {
    status: ReviewStatus.Kinnitatud,
    ...(reviewerId ? { reviewed_by: reviewerId } : {}),
    reviewed_at: new Date(),
    review_comment: null,
  };
}

function getPhotoRejectData(
  reviewComment: string,
  reviewerId?: number
): ReviewData {
  if (!reviewComment || !reviewComment.trim()) {
    throw new Error("Reject comment is required");
  }

  return {
    status: ReviewStatus.Tagasi_lukatud,
    ...(reviewerId ? { reviewed_by: reviewerId } : {}),
    reviewed_at: new Date(),
    review_comment: reviewComment.trim(),
  };
}

function getPendingReviewData(): ReviewData {
  return {
    status: ReviewStatus.Ootel,
    reviewed_by: null,
    reviewed_at: null,
    review_comment: null,
  };
}

async function setPhotoCityStatus(
  tx: Prisma.TransactionClient,
  photoId: number,
  data: ReviewData
) {
  const photo = await tx.photos.findUnique({
    where: {
      photo_id: photoId,
    },
    select: {
      city_id: true,
    },
  });

  if (!photo?.city_id) {
    return;
  }

  const city = await tx.cities.findUnique({
    where: {
      city_id: photo.city_id,
    },
    select: {
      status: true,
    },
  });

  if (!city || city.status === ReviewStatus.Kinnitatud) {
    return;
  }

  await tx.cities.update({
    where: {
      city_id: photo.city_id,
    },
    data,
  });
}

export async function getManagePhotos(params: GetManagePhotosParams) {
  const {
    page,
    limit,
    status,
    regNumber,
    cityId,
    countyId,
    vehicleId,
    authorId,
    vehicleCreatorId,
    categoryId,
    condition,
    createdFrom,
    createdTo,
  } = params;

  const skip = (page - 1) * limit;
  const filters: Prisma.Sql[] = [];

  if (status) {
    filters.push(Prisma.sql`p.status = ${status}`);
  }

  if (regNumber) {
    filters.push(Prisma.sql`p.reg_number ILIKE ${`%${regNumber}%`}`);
  }

  if (cityId) {
    filters.push(Prisma.sql`p.city_id = ${cityId}`);
  }

  if (countyId) {
    filters.push(Prisma.sql`p.county_id = ${countyId}`);
  }

  if (vehicleId) {
    filters.push(Prisma.sql`p.vehicle_id = ${vehicleId}`);
  }

  if (authorId) {
    filters.push(Prisma.sql`p.author_id = ${authorId}`);
  }

  if (vehicleCreatorId) {
    filters.push(Prisma.sql`p.vehicle_created_by = ${vehicleCreatorId}`);
  }

  if (categoryId) {
    filters.push(Prisma.sql`p.category_id = ${categoryId}`);
  }

  if (condition) {
    filters.push(Prisma.sql`p.vehicle_condition = ${condition}`);
  }

  if (createdFrom) {
    filters.push(Prisma.sql`p.created_at >= ${createdFrom}`);
  }

  if (createdTo) {
    filters.push(Prisma.sql`p.created_at <= ${createdTo}`);
  }

  const whereSql =
    filters.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
      : Prisma.empty;

  const items = await prisma.$queryRaw<ManagePhotoViewRow[]>`
    SELECT *
    FROM ${Prisma.raw(dbView("v_manage_photos"))} p
    ${whereSql}
    ORDER BY p.created_at DESC, p.photo_id DESC
    OFFSET ${skip}
    LIMIT ${limit}
  `;

  const totalRows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*) AS total
    FROM ${Prisma.raw(dbView("v_manage_photos"))} p
    ${whereSql}
  `;

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: items.map(mapManagePhotoFromView),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getManagePhotoById(photoId: number) {
  return prisma.photos.findUnique({
    where: {
      photo_id: photoId,
    },
    include: managePhotoDetailInclude,
  });
}

export async function approveManagePhoto(
  photoId: number,
  reviewerId?: number
) {
  await prisma.$transaction(async (tx) => {
    const reviewData = getPhotoApproveData(reviewerId);

    await setPhotoCityStatus(tx, photoId, reviewData);

    await tx.photos.update({
      where: {
        photo_id: photoId,
      },
      data: reviewData,
    });
  });

  return getManagePhotoById(photoId);
}

export async function rejectManagePhoto(
  photoId: number,
  reviewComment: string,
  reviewerId?: number
) {
  await prisma.$transaction(async (tx) => {
    const reviewData = getPhotoRejectData(reviewComment, reviewerId);

    await setPhotoCityStatus(tx, photoId, reviewData);

    await tx.photos.update({
      where: {
        photo_id: photoId,
      },
      data: reviewData,
    });
  });

  return getManagePhotoById(photoId);
}

export async function pendingManagePhoto(photoId: number) {
  const wasUpdated = await prisma.$transaction(async (tx) => {
    const currentPhoto = await tx.photos.findUnique({
      where: {
        photo_id: photoId,
      },
      select: {
        city_id: true,
      },
    });

    if (!currentPhoto) {
      return null;
    }

    const pendingData = getPendingReviewData();

    if (currentPhoto.city_id) {
      const city = await tx.cities.findUnique({
        where: {
          city_id: currentPhoto.city_id,
        },
        select: {
          status: true,
        },
      });

      if (city && city.status !== ReviewStatus.Kinnitatud) {
        await tx.cities.update({
          where: {
            city_id: currentPhoto.city_id,
          },
          data: pendingData,
        });
      }
    }

    await tx.photos.update({
      where: {
        photo_id: photoId,
      },
      data: pendingData,
    });

    return true;
  });

  return wasUpdated ? getManagePhotoById(photoId) : null;
}
