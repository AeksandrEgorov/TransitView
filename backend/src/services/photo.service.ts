import prisma from "../config/prisma.js";
import type { UpdatePhotoBody } from "../types/photo.js";

interface GetPublicPhotosParams {
  page: number;
  limit: number;
  cityId?: number;
  vehicleId?: number;
}

interface CreatePhotoData {
  vehicle_id: number;
  city_id?: number | null;
  place?: string | null;
  taken_at?: string | null;
  file_path: string;
  user_id: number;
}

export async function getPublicPhotos(params: GetPublicPhotosParams) {
  const { page, limit, cityId, vehicleId } = params;
  const skip = (page - 1) * limit;

  const where = {
    status: "Kinnitatud" as const,
    ...(cityId ? { city_id: cityId } : {}),
    ...(vehicleId ? { vehicle_id: vehicleId } : {}),
    vehicle: {
      status: "Kinnitatud" as const,
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

export async function getPhotoById(photoId: number) {
  return prisma.photos.findFirst({
    where: {
      photo_id: photoId,
      status: "Kinnitatud",
      vehicle: {
        status: "Kinnitatud",
      },
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
    },
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
    status: "Kinnitatud" as const,
    vehicle: {
      status: "Kinnitatud" as const,
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

export async function createPhoto(data: CreatePhotoData) {
  return prisma.photos.create({
    data: {
      vehicle_id: data.vehicle_id,
      author_id: data.user_id,
      city_id: data.city_id ?? null,
      place: data.place ?? null,
      taken_at: data.taken_at ? new Date(data.taken_at) : null,
      file_path: data.file_path,
      status: "Ootel",
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
    status: "Ootel" as const,
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
        vehicle: {
          include: {
            model: true,
            branch: {
              include: {
                company: true,
                city: true,
              },
            },
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

export async function approvePhoto(photoId: number) {
  return prisma.photos.update({
    where: {
      photo_id: photoId,
    },
    data: {
      status: "Kinnitatud",
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
      status: "Tagasi_lukatud",
      reviewed_at: new Date(),
      review_comment: reviewComment,
    },
  });
}