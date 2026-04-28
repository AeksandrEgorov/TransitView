import prisma from "../config/prisma.js";
import { ReviewStatus } from "../generated/prisma/client.js";
import type { UpdatePhotoBody } from "../types/photo.js";

interface GetPublicPhotosParams {
  page: number;
  limit: number;
  cityId?: number;
  countyId?: number;
  vehicleId?: number;
}

interface GetMyPhotosParams {
  userId: number;
  page: number;
  limit: number;
  status?: "Ootel" | "Tagasi_lukatud" | "Kinnitatud";
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

const photoPublicInclude = {
  author: {
    select: {
      user_id: true,
      username: true,
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
    },
  },
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

export async function getPublicPhotos(params: GetPublicPhotosParams) {
  const { page, limit, cityId, countyId, vehicleId } = params;
  const skip = (page - 1) * limit;

  const locationFilter =
    cityId || countyId
      ? {
          ...(cityId ? { city_id: cityId } : {}),
          ...(countyId
            ? {
                city: {
                  county_id: countyId,
                },
              }
            : {}),
        }
      : {};

  const where = {
    status: ReviewStatus.Kinnitatud,
    ...(vehicleId ? { vehicle_id: vehicleId } : {}),
    ...locationFilter,
    vehicle: {
      status: ReviewStatus.Kinnitatud,
    },
  };

  const [items, total] = await Promise.all([
    prisma.photos.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        created_at: "desc",
      },
      include: photoPublicInclude,
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

export async function getPhotoById(photoId: number) {
  return prisma.photos.findFirst({
    where: {
      photo_id: photoId,
      status: ReviewStatus.Kinnitatud,
      vehicle: {
        status: ReviewStatus.Kinnitatud,
      },
    },
    include: photoPublicInclude,
  });
}

export async function getPhotosByVehicleId(params: {
  vehicleId: number;
  page: number;
  limit: number;
}) {
  const { vehicleId, page, limit } = params;
  const skip = (page - 1) * limit;

  const where = {
    vehicle_id: vehicleId,
    status: ReviewStatus.Kinnitatud,
    vehicle: {
      status: ReviewStatus.Kinnitatud,
    },
  };

  const [items, total] = await Promise.all([
    prisma.photos.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        created_at: "asc",
      },
      include: {
        author: {
          select: {
            user_id: true,
            username: true,
          },
        },
        city: {
          include: {
            county: true,
          },
        },
      },
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

export async function getMyPhotos(params: GetMyPhotosParams) {
  const { userId, page, limit, status } = params;
  const skip = (page - 1) * limit;

  const where = {
    author_id: userId,
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.photos.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        created_at: "desc",
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
  return prisma.photos.update({
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
}

export async function deletePhoto(photoId: number) {
  return prisma.photos.delete({
    where: {
      photo_id: photoId,
    },
  });
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