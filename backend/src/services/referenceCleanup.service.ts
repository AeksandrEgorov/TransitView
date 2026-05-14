// This service removes unused pending reference records.
// It helps keep new cities, branches, companies, and models from staying around after drafts are deleted.

import { Prisma, ReviewStatus } from "../generated/prisma/client.js";

type Tx = Prisma.TransactionClient;

type PhotoReferenceData = {
  city_id?: number | null;
};

type VehicleReferenceData = {
  model_id?: number | null;
  branch_id?: number | null;
  photo_city_ids?: Array<number | null>;
};

function getPendingReviewData() {
  return {
    status: ReviewStatus.Ootel,
    reviewed_by: null,
    reviewed_at: null,
    review_comment: null,
  };
}

async function hasConfirmedModelUse(tx: Tx, modelId: number) {
  const vehiclesCount = await tx.vehicles.count({
    where: {
      model_id: modelId,
      status: ReviewStatus.Kinnitatud,
    },
  });

  return vehiclesCount > 0;
}

async function hasConfirmedBranchUse(tx: Tx, branchId: number) {
  const vehiclesCount = await tx.vehicles.count({
    where: {
      branch_id: branchId,
      status: ReviewStatus.Kinnitatud,
    },
  });

  return vehiclesCount > 0;
}

async function hasConfirmedCompanyUse(tx: Tx, companyId: number) {
  const branchesCount = await tx.company_branches.count({
    where: {
      company_id: companyId,
      vehicles: {
        some: {
          status: ReviewStatus.Kinnitatud,
        },
      },
    },
  });

  return branchesCount > 0;
}

async function hasConfirmedCityUse(tx: Tx, cityId: number) {
  const photosCount = await tx.photos.count({
    where: {
      city_id: cityId,
      status: ReviewStatus.Kinnitatud,
      vehicle: {
        status: ReviewStatus.Kinnitatud,
      },
    },
  });

  if (photosCount > 0) {
    return true;
  }

  const branchesCount = await tx.company_branches.count({
    where: {
      city_id: cityId,
      vehicles: {
        some: {
          status: ReviewStatus.Kinnitatud,
        },
      },
    },
  });

  if (branchesCount > 0) {
    return true;
  }

  const companiesCount = await tx.companies.count({
    where: {
      city_id: cityId,
      branches: {
        some: {
          vehicles: {
            some: {
              status: ReviewStatus.Kinnitatud,
            },
          },
        },
      },
    },
  });

  return companiesCount > 0;
}

async function resetModelToPendingIfUnusedByConfirmed(
  tx: Tx,
  modelId?: number | null
) {
  if (!modelId || (await hasConfirmedModelUse(tx, modelId))) {
    return;
  }

  await tx.models.updateMany({
    where: {
      model_id: modelId,
      status: ReviewStatus.Kinnitatud,
    },
    data: getPendingReviewData(),
  });
}

async function resetBranchToPendingIfUnusedByConfirmed(
  tx: Tx,
  branchId?: number | null
) {
  if (!branchId || (await hasConfirmedBranchUse(tx, branchId))) {
    return;
  }

  await tx.company_branches.updateMany({
    where: {
      branch_id: branchId,
      status: ReviewStatus.Kinnitatud,
    },
    data: getPendingReviewData(),
  });
}

async function resetCompanyToPendingIfUnusedByConfirmed(
  tx: Tx,
  companyId?: number | null
) {
  if (!companyId || (await hasConfirmedCompanyUse(tx, companyId))) {
    return;
  }

  await tx.companies.updateMany({
    where: {
      company_id: companyId,
      status: ReviewStatus.Kinnitatud,
    },
    data: getPendingReviewData(),
  });
}

async function resetCityToPendingIfUnusedByConfirmed(
  tx: Tx,
  cityId?: number | null
) {
  if (!cityId || (await hasConfirmedCityUse(tx, cityId))) {
    return;
  }

  await tx.cities.updateMany({
    where: {
      city_id: cityId,
      status: ReviewStatus.Kinnitatud,
    },
    data: getPendingReviewData(),
  });
}

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

  const photosCount = await tx.photos.count({
    where: {
      city_id: cityId,
    },
  });

  const branchesCount = await tx.company_branches.count({
    where: {
      city_id: cityId,
    },
  });

  const companiesCount = await tx.companies.count({
    where: {
      city_id: cityId,
    },
  });

  if (photosCount > 0 || branchesCount > 0 || companiesCount > 0) {
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
    return {
      deleted: false,
      cityId: null,
    };
  }

  const company = await tx.companies.findUnique({
    where: {
      company_id: companyId,
    },
    select: {
      company_id: true,
      city_id: true,
      status: true,
    },
  });

  if (!company || company.status === ReviewStatus.Kinnitatud) {
    return {
      deleted: false,
      cityId: company?.city_id ?? null,
    };
  }

  const branchesCount = await tx.company_branches.count({
    where: {
      company_id: companyId,
    },
  });

  if (branchesCount > 0) {
    return {
      deleted: false,
      cityId: company.city_id,
    };
  }

  await tx.companies.deleteMany({
    where: {
      company_id: companyId,
      status: {
        not: ReviewStatus.Kinnitatud,
      },
    },
  });

  return {
    deleted: true,
    cityId: company.city_id,
  };
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

export async function resetConfirmedVehicleReferencesToPendingIfUnused(
  tx: Tx,
  vehicleId: number
) {
  const vehicle = await tx.vehicles.findUnique({
    where: {
      vehicle_id: vehicleId,
    },
    select: {
      model_id: true,
      branch_id: true,
      photos: {
        select: {
          city_id: true,
        },
      },
    },
  });

  if (!vehicle) {
    return;
  }

  await resetModelToPendingIfUnusedByConfirmed(tx, vehicle.model_id);

  let branchCityId: number | null = null;
  let companyCityId: number | null = null;
  let companyId: number | null = null;

  if (vehicle.branch_id) {
    const branch = await tx.company_branches.findUnique({
      where: {
        branch_id: vehicle.branch_id,
      },
      select: {
        company_id: true,
        city_id: true,
        company: {
          select: {
            city_id: true,
          },
        },
      },
    });

    branchCityId = branch?.city_id ?? null;
    companyCityId = branch?.company?.city_id ?? null;
    companyId = branch?.company_id ?? null;

    await resetBranchToPendingIfUnusedByConfirmed(tx, vehicle.branch_id);
    await resetCompanyToPendingIfUnusedByConfirmed(tx, companyId);
  }

  const uniqueCityIds = Array.from(
    new Set(
      [
        branchCityId,
        companyCityId,
        ...vehicle.photos.map((photo) => photo.city_id),
      ].filter((cityId): cityId is number => typeof cityId === "number")
    )
  );

  for (const cityId of uniqueCityIds) {
    await resetCityToPendingIfUnusedByConfirmed(tx, cityId);
  }
}

export async function cleanupUnusedVehicleReferences(
  tx: Tx,
  vehicle: VehicleReferenceData
) {
  await cleanupUnusedModel(tx, vehicle.model_id);

  const branchCleanupResult = await cleanupUnusedBranch(tx, vehicle.branch_id);

  if (branchCleanupResult.deleted) {
    const companyCleanupResult = await cleanupUnusedCompany(
      tx,
      branchCleanupResult.companyId
    );

    if (companyCleanupResult.deleted) {
      await cleanupUnusedCity(tx, companyCleanupResult.cityId);
    }

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
