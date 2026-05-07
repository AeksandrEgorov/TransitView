import prisma from "../config/prisma.js";
import {
  Prisma,
  ReviewStatus,
  type VehicleCondition,
} from "../generated/prisma/client.js";
import type { UpdatePhotoBody } from "../types/photo.js";
import { deleteCloudinaryImage } from "../utils/uploadToCloudinary.js";
import { dbView } from "../utils/dbView.js";

interface GetPublicPhotosParams {
  page: number;
  limit: number;
  cityId?: number;
  countyId?: number;
  vehicleId?: number;
  regNumber?: string;
  categoryId?: number;
  condition?: VehicleCondition;
  createdFrom?: Date;
  createdTo?: Date;
}

interface GetMyPhotosParams {
  userId: number;
  page: number;
  limit: number;
  status?: ReviewStatus;
}

interface CreatePhotoData {
  vehicle_id: number;
  city_id?: number | null;
  place?: string | null;
  taken_at?: string | null;
  file_path: string;
  cloudinary_public_id?: string | null;
  user_id: number;
}

type CountRow = {
  total: bigint | number;
};

type PublicPhotoViewRow = {
  photo_id: number;
  vehicle_id: number;
  author_id: number | null;
  city_id: number | null;
  place: string | null;
  taken_at: Date | null;
  file_path: string;
  cloudinary_public_id: string | null;
  status: string;
  created_at: Date;

  reg_number: string;
  vla_year: number | null;
  vehicle_condition: string;

  model_id: number;
  manufacturer: string;
  model_name: string;

  category_id: number;
  category_name: string;

  city_name: string | null;
  county_id: number | null;
  county_name: string | null;

  author_username: string | null;
};

type PublicVehiclePhotoViewRow = {
  photo_id: number;
  vehicle_id: number;
  city_id: number | null;
  place: string | null;
  taken_at: Date | null;
  file_path: string;
  cloudinary_public_id: string | null;
  status: string;
  created_at: Date;

  city_name: string | null;
  county_id: number | null;
  county_name: string | null;

  author_id: number | null;
  author_username: string | null;
};

type MyPhotoViewRow = {
  photo_id: number;
  vehicle_id: number;
  author_id: number;
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

  manufacturer: string;
  model_name: string;

  category_id: number;
  category_name: string;

  city_name: string | null;
  county_name: string | null;

  author_username: string | null;
};

const photoDashboardInclude = {
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

function mapPublicPhotoFromView(row: PublicPhotoViewRow) {
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
    review_comment: null,
    reviewed_at: null,
    created_at: row.created_at,

    author: row.author_id
      ? {
          user_id: row.author_id,
          username: row.author_username,
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
      vla_year: row.vla_year,
      condition: row.vehicle_condition as VehicleCondition,
      status: ReviewStatus.Kinnitatud,
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
      branch: null,
    },
  };
}

function mapPublicVehiclePhotoFromView(row: PublicVehiclePhotoViewRow) {
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
    review_comment: null,
    reviewed_at: null,
    created_at: row.created_at,

    author: row.author_id
      ? {
          user_id: row.author_id,
          username: row.author_username,
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
  };
}

function mapMyPhotoFromView(row: MyPhotoViewRow) {
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

    author: {
      user_id: row.author_id,
      username: row.author_username,
    },

    city: row.city_id
      ? {
          city_id: row.city_id,
          name: row.city_name,
          county: {
            name: row.county_name,
          },
        }
      : null,

    vehicle: {
      vehicle_id: row.vehicle_id,
      reg_number: row.reg_number,
      status: row.vehicle_status as ReviewStatus,
      condition: row.vehicle_condition as VehicleCondition,
      model: {
        manufacturer: row.manufacturer,
        name: row.model_name,
        category: {
          category_id: row.category_id,
          name: row.category_name,
        },
      },
    },
  };
}

export async function getPublicPhotos(params: GetPublicPhotosParams) {
  const {
    page,
    limit,
    cityId,
    countyId,
    vehicleId,
    regNumber,
    categoryId,
    condition,
    createdFrom,
    createdTo,
  } = params;

  const skip = (page - 1) * limit;
  const filters: Prisma.Sql[] = [];

  if (vehicleId) {
    filters.push(Prisma.sql`p.vehicle_id = ${vehicleId}`);
  }

  if (cityId) {
    filters.push(Prisma.sql`p.city_id = ${cityId}`);
  }

  if (countyId) {
    filters.push(Prisma.sql`p.county_id = ${countyId}`);
  }

  if (regNumber) {
    filters.push(Prisma.sql`p.reg_number ILIKE ${`%${regNumber}%`}`);
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

  const [items, totalRows] = await Promise.all([
    prisma.$queryRaw<PublicPhotoViewRow[]>`
      SELECT *
      FROM ${Prisma.raw(dbView("v_public_photos"))} p
      ${whereSql}
      ORDER BY p.created_at DESC, p.photo_id DESC
      OFFSET ${skip}
      LIMIT ${limit}
    `,

    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS total
      FROM ${Prisma.raw(dbView("v_public_photos"))} p
      ${whereSql}
    `,
  ]);

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: items.map(mapPublicPhotoFromView),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPhotoById(photoId: number) {
  const rows = await prisma.$queryRaw<PublicPhotoViewRow[]>`
    SELECT *
    FROM ${Prisma.raw(dbView("v_public_photos"))} p
    WHERE p.photo_id = ${photoId}
    LIMIT 1
  `;

  const photo = rows[0];

  if (!photo) {
    return null;
  }

  return mapPublicPhotoFromView(photo);
}

export async function getPhotosByVehicleId(params: {
  vehicleId: number;
  page: number;
  limit: number;
}) {
  const { vehicleId, page, limit } = params;
  const skip = (page - 1) * limit;

  const [items, totalRows] = await Promise.all([
    prisma.$queryRaw<PublicVehiclePhotoViewRow[]>`
      SELECT *
      FROM ${Prisma.raw(dbView("v_public_vehicle_photos"))} p
      WHERE p.vehicle_id = ${vehicleId}
      ORDER BY p.created_at ASC, p.photo_id ASC
      OFFSET ${skip}
      LIMIT ${limit}
    `,

    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS total
      FROM ${Prisma.raw(dbView("v_public_vehicle_photos"))} p
      WHERE p.vehicle_id = ${vehicleId}
    `,
  ]);

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: items.map(mapPublicVehiclePhotoFromView),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMyPhotos(params: GetMyPhotosParams) {
  const { userId, page, limit, status } = params;
  const skip = (page - 1) * limit;

  const filters: Prisma.Sql[] = [Prisma.sql`p.author_id = ${userId}`];

  if (status) {
    filters.push(Prisma.sql`p.status = ${status}`);
  }

  const whereSql = Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`;

  const [items, totalRows] = await Promise.all([
    prisma.$queryRaw<MyPhotoViewRow[]>`
      SELECT *
      FROM ${Prisma.raw(dbView("v_my_photos"))} p
      ${whereSql}
      ORDER BY p.created_at DESC, p.photo_id DESC
      OFFSET ${skip}
      LIMIT ${limit}
    `,

    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS total
      FROM ${Prisma.raw(dbView("v_my_photos"))} p
      ${whereSql}
    `,
  ]);

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: items.map(mapMyPhotoFromView),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMyPhotoById(photoId: number, userId: number) {
  return prisma.photos.findFirst({
    where: {
      photo_id: photoId,
      author_id: userId,
    },
    include: photoDashboardInclude,
  });
}

export async function createPhoto(data: CreatePhotoData) {
  return prisma.photos.create({
    data: {
      vehicle_id: data.vehicle_id,
      author_id: data.user_id,
      city_id: data.city_id ?? null,
      place: data.place ?? null,
      taken_at: data.taken_at ? new Date(data.taken_at) : null,
      file_path: data.file_path,
      cloudinary_public_id: data.cloudinary_public_id ?? null,
      status: ReviewStatus.Ootel,
      review_comment: null,
    },
  });
}

export async function getPhotoForEdit(photoId: number) {
  return prisma.photos.findUnique({
    where: {
      photo_id: photoId,
    },
  });
}

export async function updatePhoto(photoId: number, data: UpdatePhotoBody) {
  const oldPhoto = await prisma.photos.findUnique({
    where: {
      photo_id: photoId,
    },
  });

  if (!oldPhoto) {
    return null;
  }

  const updatedPhoto = await prisma.photos.update({
    where: {
      photo_id: photoId,
    },
    data: {
      ...(data.city_id !== undefined ? { city_id: data.city_id } : {}),
      ...(data.place !== undefined ? { place: data.place } : {}),
      ...(data.taken_at !== undefined
        ? { taken_at: data.taken_at ? new Date(data.taken_at) : null }
        : {}),
      ...(data.file_path !== undefined ? { file_path: data.file_path } : {}),
      ...(data.cloudinary_public_id !== undefined
        ? { cloudinary_public_id: data.cloudinary_public_id }
        : {}),
    },
  });

  const imageWasReplaced =
    data.cloudinary_public_id &&
    oldPhoto.cloudinary_public_id &&
    data.cloudinary_public_id !== oldPhoto.cloudinary_public_id;

  if (imageWasReplaced) {
    try {
      await deleteCloudinaryImage(oldPhoto.cloudinary_public_id);
    } catch (error) {
      console.error("Failed to delete old Cloudinary image:", error);
    }
  }

  return updatedPhoto;
}

export async function deletePhoto(photoId: number) {
  const photo = await prisma.photos.findUnique({
    where: {
      photo_id: photoId,
    },
  });

  if (!photo) {
    return null;
  }

  await prisma.photos.delete({
    where: {
      photo_id: photoId,
    },
  });

  if (photo.cloudinary_public_id) {
    try {
      await deleteCloudinaryImage(photo.cloudinary_public_id);
    } catch (error) {
      console.error("Failed to delete Cloudinary image:", error);
    }
  }

  return photo;
}

export async function getPendingPhotos(params: {
  page: number;
  limit: number;
}) {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const where = {
    status: ReviewStatus.Ootel,
  };

  const [items, total] = await Promise.all([
    prisma.photos.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        created_at: "asc",
      },
      include: photoDashboardInclude,
    }),
    prisma.photos.count({ where }),
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

export async function approvePhoto(photoId: number) {
  return prisma.photos.update({
    where: {
      photo_id: photoId,
    },
    data: {
      status: ReviewStatus.Kinnitatud,
      reviewed_at: new Date(),
      review_comment: null,
    },
  });
}

export async function rejectPhoto(photoId: number, reviewComment: string) {
  return prisma.photos.update({
    where: {
      photo_id: photoId,
    },
    data: {
      status: ReviewStatus.Tagasi_lukatud,
      reviewed_at: new Date(),
      review_comment: reviewComment,
    },
  });
}