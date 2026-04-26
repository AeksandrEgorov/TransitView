import prisma from "../config/prisma.js";
import { Prisma, ReviewStatus } from "../generated/prisma/client.js";

interface GetManagePhotosParams {
  page: number;
  limit: number;

  status?: ReviewStatus;

  cityId?: number;
  countyId?: number;
  vehicleId?: number;
  authorId?: number;

  createdFrom?: Date;
  createdTo?: Date;
}

const managePhotoListInclude = {
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

export async function getManagePhotos(params: GetManagePhotosParams) {
  const {
    page,
    limit,
    status,
    cityId,
    countyId,
    vehicleId,
    authorId,
    createdFrom,
    createdTo,
  } = params;

  const skip = (page - 1) * limit;

  const createdAtWhere =
    createdFrom || createdTo
      ? {
          ...(createdFrom ? { gte: createdFrom } : {}),
          ...(createdTo ? { lte: createdTo } : {}),
        }
      : undefined;

  const where: Prisma.PhotosWhereInput = {
    ...(status ? { status } : {}),
    ...(cityId ? { city_id: cityId } : {}),
    ...(vehicleId ? { vehicle_id: vehicleId } : {}),
    ...(authorId ? { author_id: authorId } : {}),
    ...(createdAtWhere ? { created_at: createdAtWhere } : {}),
    ...(countyId
      ? {
          city: {
            county_id: countyId,
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.photos.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        created_at: "desc",
      },
      include: managePhotoListInclude,
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

export async function getManagePhotoById(photoId: number) {
  return prisma.photos.findUnique({
    where: {
      photo_id: photoId,
    },
    include: managePhotoListInclude,
  });
}