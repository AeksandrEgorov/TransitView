import prisma from "../config/prisma.js";
import {
  Prisma,
  ReviewStatus,
} from "../generated/prisma/client.js";

interface GetManageVehiclesParams {
  page: number;
  limit: number;

  status?: ReviewStatus;

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

const manageVehicleListInclude = {
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

export async function getManageVehicles(params: GetManageVehiclesParams) {
  const {
    page,
    limit,
    status,
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

  const locationFilter: Prisma.VehiclesWhereInput =
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

  const where: Prisma.VehiclesWhereInput = {
    ...(status ? { status } : {}),

    ...(regNumber
      ? {
          reg_number: {
            contains: regNumber,
            mode: "insensitive",
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
      include: manageVehicleListInclude,
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

export async function getManageVehicleById(vehicleId: number) {
  return prisma.vehicles.findUnique({
    where: {
      vehicle_id: vehicleId,
    },
    include: manageVehicleDetailInclude,
  });
}