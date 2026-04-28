import prisma from "../config/prisma.js";
import type { UpdateVehicleBody } from "../types/vehicle.js";
import { ReviewStatus } from "../generated/prisma/client.js";

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
  status?: "Ootel" | "Tagasi_lukatud" | "Kinnitatud";
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

  user_id: number;
}

const vehiclePublicInclude = {
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
  photos: {
    where: {
      status: "Kinnitatud" as const,
    },
    orderBy: {
      created_at: "desc" as const,
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
    },
  },
  photos: {
    where: {
      status: {
        in: [ReviewStatus.Ootel, ReviewStatus.Tagasi_lukatud],
      },
    },
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

  const createdAtWhere =
    createdFrom || createdTo
      ? {
          ...(createdFrom ? { gte: createdFrom } : {}),
          ...(createdTo ? { lte: createdTo } : {}),
        }
      : undefined;

  const locationFilter =
    cityId || countyId
      ? {
          OR: [
            {
              branch: {
                ...(cityId ? { city_id: cityId } : {}),
                ...(countyId
                  ? {
                      city: {
                        county_id: countyId,
                      },
                    }
                  : {}),
              },
            },
            {
              photos: {
                some: {
                  status: "Kinnitatud" as const,
                  ...(cityId ? { city_id: cityId } : {}),
                  ...(countyId
                    ? {
                        city: {
                          county_id: countyId,
                        },
                      }
                    : {}),
                },
              },
            },
          ],
        }
      : {};

  const where = {
    status: "Kinnitatud" as const,

    ...(regNumber
      ? {
          reg_number: {
            contains: regNumber,
            mode: "insensitive" as const,
          },
        }
      : {}),

    ...(modelId ? { model_id: modelId } : {}),
    ...(branchId ? { branch_id: branchId } : {}),

    ...(companyId
      ? {
          branch: {
            company_id: companyId,
          },
        }
      : {}),

    ...(condition ? { condition: condition as any } : {}),
    ...(createdAtWhere ? { created_at: createdAtWhere } : {}),

    ...(categoryId
      ? {
          model: {
            category_id: categoryId,
          },
        }
      : {}),

    ...locationFilter,
  };

  const [items, total] = await Promise.all([
    prisma.vehicles.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        created_at: "desc",
      },
      include: vehiclePublicInclude,
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

export async function getMyVehicles(params: GetMyVehiclesParams) {
  const { userId, page, limit, status } = params;

  const skip = (page - 1) * limit;

  const where = {
    created_by: userId,
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.vehicles.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        created_at: "desc",
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
        where: {
          status: {
            in: [ReviewStatus.Ootel, ReviewStatus.Tagasi_lukatud],
          },
        },
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

export async function getVehicleById(vehicleId: number) {
  return prisma.vehicles.findFirst({
    where: {
      vehicle_id: vehicleId,
      status: "Kinnitatud",
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
        where: {
          status: "Kinnitatud",
        },
        orderBy: {
          created_at: "desc",
        },
        take: 1,
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
        status: "Ootel",
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
        status: "Ootel",
        review_comment: null,
      },
    });

    return { vehicle, photo };
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
    status: "Ootel" as const,
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
        status: "Kinnitatud",
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
          status: "Kinnitatud",
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
        status: "Tagasi_lukatud",
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
          status: "Tagasi_lukatud",
          reviewed_at: new Date(),
          review_comment: reviewComment,
        },
      });
    }

    return vehicle;
  });
}