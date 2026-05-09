import { Prisma, ReviewStatus } from "../generated/prisma/client.js";

type Tx = Prisma.TransactionClient;

type PhotoReferenceData = {
  city_id?: number | null;
};

type VehicleReferenceData = {
  model_id?: number | null;
  branch_id?: number | null;
  photo_city_ids?: Array<number | null | undefined>;
};

async function cleanupUnusedCity(tx: Tx, cityId?: number | null) {
  if (!cityId) {
    return;
  }

  const city = await tx.cities.findUnique({
    where: {
      city_id: cityId,
    },
    select: {
      city_id: true,
      status: true,
    },
  });

  if (!city || city.status === ReviewStatus.Kinnitatud) {
    return;
  }

  const [photosCount, branchesCount] = await Promise.all([
    tx.photos.count({
      where: {
        city_id: cityId,
      },
    }),

    tx.company_branches.count({
      where: {
        city_id: cityId,
      },
    }),
  ]);

  if (photosCount > 0 || branchesCount > 0) {
    return;
  }

  await tx.cities.deleteMany({
    where: {
      city_id: cityId,
      status: {
        not: ReviewStatus.Kinnitatud,
      },
    },
  });
}

async function cleanupUnusedModel(tx: Tx, modelId?: number | null) {
  if (!modelId) {
    return;
  }

  const model = await tx.models.findUnique({
    where: {
      model_id: modelId,
    },
    select: {
      model_id: true,
      status: true,
    },
  });

  if (!model || model.status === ReviewStatus.Kinnitatud) {
    return;
  }

  const vehiclesCount = await tx.vehicles.count({
    where: {
      model_id: modelId,
    },
  });

  if (vehiclesCount > 0) {
    return;
  }

  await tx.models.deleteMany({
    where: {
      model_id: modelId,
      status: {
        not: ReviewStatus.Kinnitatud,
      },
    },
  });
}

async function cleanupUnusedCompany(tx: Tx, companyId?: number | null) {
  if (!companyId) {
    return;
  }

  const company = await tx.companies.findUnique({
    where: {
      company_id: companyId,
    },
    select: {
      company_id: true,
      status: true,
    },
  });

  if (!company || company.status === ReviewStatus.Kinnitatud) {
    return;
  }

  const branchesCount = await tx.company_branches.count({
    where: {
      company_id: companyId,
    },
  });

  if (branchesCount > 0) {
    return;
  }

  await tx.companies.deleteMany({
    where: {
      company_id: companyId,
      status: {
        not: ReviewStatus.Kinnitatud,
      },
    },
  });
}

async function cleanupUnusedBranch(tx: Tx, branchId?: number | null) {
  if (!branchId) {
    return {
      deleted: false,
      companyId: null,
      cityId: null,
    };
  }

  const branch = await tx.company_branches.findUnique({
    where: {
      branch_id: branchId,
    },
    select: {
      branch_id: true,
      company_id: true,
      city_id: true,
      status: true,
    },
  });

  if (!branch || branch.status === ReviewStatus.Kinnitatud) {
    return {
      deleted: false,
      companyId: branch?.company_id ?? null,
      cityId: branch?.city_id ?? null,
    };
  }

  const vehiclesCount = await tx.vehicles.count({
    where: {
      branch_id: branchId,
    },
  });

  if (vehiclesCount > 0) {
    return {
      deleted: false,
      companyId: branch.company_id,
      cityId: branch.city_id,
    };
  }

  await tx.company_branches.deleteMany({
    where: {
      branch_id: branchId,
      status: {
        not: ReviewStatus.Kinnitatud,
      },
    },
  });

  return {
    deleted: true,
    companyId: branch.company_id,
    cityId: branch.city_id,
  };
}

export async function cleanupUnusedPhotoReferences(
  tx: Tx,
  photo: PhotoReferenceData
) {
  await cleanupUnusedCity(tx, photo.city_id);
}

export async function cleanupUnusedVehicleReferences(
  tx: Tx,
  vehicle: VehicleReferenceData
) {
  await cleanupUnusedModel(tx, vehicle.model_id);

  const branchCleanupResult = await cleanupUnusedBranch(tx, vehicle.branch_id);

  if (branchCleanupResult.deleted) {
    await cleanupUnusedCompany(tx, branchCleanupResult.companyId);
    await cleanupUnusedCity(tx, branchCleanupResult.cityId);
  }

  const uniquePhotoCityIds = Array.from(
    new Set(
      (vehicle.photo_city_ids ?? []).filter(
        (cityId): cityId is number => typeof cityId === "number"
      )
    )
  );

  for (const cityId of uniquePhotoCityIds) {
    await cleanupUnusedCity(tx, cityId);
  }
}