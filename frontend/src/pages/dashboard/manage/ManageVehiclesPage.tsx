// This page is the editor/admin vehicle moderation list.
// It loads all vehicle statuses, manage-only filters, stats, and review actions.

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import DashboardPageHeader from "../../../components/dashboard/DashboardPageHeader";
import DashboardStatCard from "../../../components/dashboard/DashboardStatCard";
import DashboardFiltersPanel from "../../../components/dashboard/DashboardFiltersPanel";
import ManageVehiclesFilters, {
  type ManageVehicleFilterState,
} from "../../../components/dashboard/manage-vehicles/ManageVehiclesFilters";
import ManageVehicleCard from "../../../components/dashboard/manage-vehicles/ManageVehicleCard";

import AddPhotoModal from "../../../components/modals/photos/AddPhotoModal";
import UpdateVehicleModal from "../../../components/modals/vehicles/UpdateVehicleModal";
import DeleteConfirmModal from "../../../components/modals/confirm/DeleteConfirmModal";
import ApproveConfirmModal from "../../../components/modals/review/ApproveConfirmModal";
import RejectReasonModal from "../../../components/modals/review/RejectReasonModal";
import PendingConfirmModal from "../../../components/modals/review/PendingConfirmModal";

import {
  approveManageVehicle,
  deleteManageVehicle,
  getManageUsers,
  getManageVehicleById,
  getManageVehicles,
  rejectManageVehicle,
  updateManagePhoto,
  updateManageVehicle,
  pendingManageVehicle,
  type ManageUserOption,
  type ManageVehicle,
} from "../../../config/manageApi";
import {
  getCities,
  getManageFilters,
} from "../../../config/referenceApi";

import { useToast } from "../../../hooks/useToast";
import { reportError } from "../../../utils/logger";
import type {
  CategoryItem,
  CityItem,
  CountyItem,
} from "../../../types/reference";
import type { ReviewStatus, VehicleCondition } from "../../../types/vehicle";

interface ManageVehicleStats {
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
}

const initialFilters: ManageVehicleFilterState = {
  status: "",
  regNumber: "",
  categoryId: null,
  countyId: null,
  cityId: null,
  condition: "",
  createdFrom: "",
  createdTo: "",
  creatorId: null,
};

const FILTER_DEBOUNCE_MS = 400;

const statusOrder: ReviewStatus[] = ["Ootel", "Kinnitatud", "Tagasi_lukatud"];

const conditionOrder: VehicleCondition[] = [
  "Töökorras",
  "Ei_tööta",
  "Maha_kantud",
  "Müüdud",
  "Teadmata",
];

function buildVehicleParams(filters: ManageVehicleFilterState) {
  const userId = filters.creatorId ?? undefined;

  return {
    status: filters.status || undefined,
    regNumber: filters.regNumber.trim() || undefined,
    categoryId: filters.categoryId ?? undefined,
    countyId: filters.countyId ?? undefined,
    cityId: filters.cityId ?? undefined,
    condition: filters.condition || undefined,
    createdFrom: filters.createdFrom || undefined,
    createdTo: filters.createdTo || undefined,
    creatorId: userId,
    createdBy: userId,
  };
}

async function optionHasResults(filters: ManageVehicleFilterState) {
  const data = await getManageVehicles({
    page: 1,
    limit: 1,
    ...buildVehicleParams(filters),
  });

  return data.meta.total > 0;
}

function ManageVehiclesPage() {
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState<ManageVehicle[]>([]);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [counties, setCounties] = useState<CountyItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [formCities, setFormCities] = useState<CityItem[]>([]);
  const [users, setUsers] = useState<ManageUserOption[]>([]);

  const [availableCategories, setAvailableCategories] = useState<
    CategoryItem[]
  >([]);
  const [availableCounties, setAvailableCounties] = useState<CountyItem[]>([]);
  const [availableCities, setAvailableCities] = useState<CityItem[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<ReviewStatus[]>(
    []
  );
  const [availableConditions, setAvailableConditions] = useState<
    VehicleCondition[]
  >([]);
  const [availableUsers, setAvailableUsers] = useState<ManageUserOption[]>([]);

  const [stats, setStats] = useState<ManageVehicleStats | null>(null);

  const [filters, setFilters] =
    useState<ManageVehicleFilterState>(initialFilters);
  const [debouncedRegNumber, setDebouncedRegNumber] = useState("");

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null
  );

  const [vehicleToEdit, setVehicleToEdit] = useState<ManageVehicle | null>(
    null
  );
  const [isUpdateVehicleOpen, setIsUpdateVehicleOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const [vehicleToDelete, setVehicleToDelete] =
    useState<ManageVehicle | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [vehicleToApprove, setVehicleToApprove] =
    useState<ManageVehicle | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const [vehicleToReject, setVehicleToReject] =
    useState<ManageVehicle | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const [vehicleToPending, setVehicleToPending] =
    useState<ManageVehicle | null>(null);
  const [isPending, setIsPending] = useState(false);

  const limit = 10;

  const appliedFilters = useMemo<ManageVehicleFilterState>(
    () => ({
      status: filters.status,
      regNumber: debouncedRegNumber,
      categoryId: filters.categoryId,
      countyId: filters.countyId,
      cityId: filters.cityId,
      condition: filters.condition,
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
      creatorId: filters.creatorId,
    }),
    [
      filters.status,
      filters.categoryId,
      filters.countyId,
      filters.cityId,
      filters.condition,
      filters.createdFrom,
      filters.createdTo,
      filters.creatorId,
      debouncedRegNumber,
    ]
  );

  const allVehiclesTotal = stats?.total ?? totalVehicles;

  const selectedVehicle = useMemo(() => {
    return (
      vehicles.find((vehicle) => vehicle.vehicle_id === selectedVehicleId) ??
      null
    );
  }, [vehicles, selectedVehicleId]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length;
  }, [filters]);

  async function loadVehicles() {
    try {
      setIsLoading(true);

      const data = await getManageVehicles({
        page,
        limit,
        ...buildVehicleParams(appliedFilters),
      });

      setVehicles(data.items);
      setTotalPages(Math.max(data.meta.totalPages, 1));
      setTotalVehicles(data.meta.total);
    } catch (error) {
      reportError(error);

      showToast({
        variant: "error",
        title: "Sõidukite laadimine ebaõnnestus",
        message: "Sõidukite nimekirja ei õnnestunud laadida.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStats() {
    try {
      setIsStatsLoading(true);

      const [allData, pendingData, confirmedData, rejectedData] =
        await Promise.all([
          getManageVehicles({ page: 1, limit: 1 }),
          getManageVehicles({ page: 1, limit: 1, status: "Ootel" }),
          getManageVehicles({ page: 1, limit: 1, status: "Kinnitatud" }),
          getManageVehicles({ page: 1, limit: 1, status: "Tagasi_lukatud" }),
        ]);

      setStats({
        total: allData.meta.total,
        pending: pendingData.meta.total,
        confirmed: confirmedData.meta.total,
        rejected: rejectedData.meta.total,
      });
    } catch (error) {
      reportError(error);

      showToast({
        variant: "error",
        title: "Statistika laadimine ebaõnnestus",
        message: "Sõidukite statistikat ei õnnestunud laadida.",
      });
    } finally {
      setIsStatsLoading(false);
    }
  }

  async function loadReferenceData() {
    try {
      const [filtersData, citiesData, usersData] =
        await Promise.all([
          getManageFilters(),
          getCities(),
          getManageUsers({ page: 1, limit: 100 }),
        ]);

      setCategories(filtersData.vehicleFilters.categories);
      setCounties(filtersData.vehicleFilters.counties);
      setCities(filtersData.vehicleFilters.cities);
      setFormCities(citiesData);
      setUsers(usersData.items);
    } catch (error) {
      reportError(error);

      showToast({
        variant: "error",
        title: "Filtrite laadimine ebaõnnestus",
        message: "Filtrite andmeid ei õnnestunud laadida.",
      });
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedRegNumber(filters.regNumber);
      setPage(1);
    }, FILTER_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filters.regNumber]);

  useEffect(() => {
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, appliedFilters]);

  useEffect(() => {
    loadStats();
    loadReferenceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadAvailableFilterOptions() {
      try {
        const citySource = appliedFilters.countyId
          ? cities.filter(
              (city) => city.county.county_id === appliedFilters.countyId
            )
          : cities;

        const [
          nextCategories,
          nextCounties,
          nextCities,
          nextStatuses,
          nextConditions,
          nextUsers,
        ] = await Promise.all([
          Promise.all(
            categories.map(async (category) => {
              const hasResults = await optionHasResults({
                ...appliedFilters,
                categoryId: category.category_id,
              });

              return hasResults ? category : null;
            })
          ),

          Promise.all(
            counties.map(async (county) => {
              const hasResults = await optionHasResults({
                ...appliedFilters,
                countyId: county.county_id,
                cityId: null,
              });

              return hasResults ? county : null;
            })
          ),

          Promise.all(
            citySource.map(async (city) => {
              const hasResults = await optionHasResults({
                ...appliedFilters,
                cityId: city.city_id,
              });

              return hasResults ? city : null;
            })
          ),

          Promise.all(
            statusOrder.map(async (status) => {
              const hasResults = await optionHasResults({
                ...appliedFilters,
                status,
              });

              return hasResults ? status : null;
            })
          ),

          Promise.all(
            conditionOrder.map(async (condition) => {
              const hasResults = await optionHasResults({
                ...appliedFilters,
                condition,
              });

              return hasResults ? condition : null;
            })
          ),

          Promise.all(
            users.map(async (user) => {
              const hasResults = await optionHasResults({
                ...appliedFilters,
                creatorId: user.user_id,
              });

              return hasResults ? user : null;
            })
          ),
        ]);

        if (isCancelled) {
          return;
        }

        setAvailableCategories(
          nextCategories.filter((item): item is CategoryItem => Boolean(item))
        );
        setAvailableCounties(
          nextCounties.filter((item): item is CountyItem => Boolean(item))
        );
        setAvailableCities(
          nextCities.filter((item): item is CityItem => Boolean(item))
        );
        setAvailableStatuses(
          nextStatuses.filter((item): item is ReviewStatus => Boolean(item))
        );
        setAvailableConditions(
          nextConditions.filter((item): item is VehicleCondition =>
            Boolean(item)
          )
        );
        setAvailableUsers(
          nextUsers.filter((item): item is ManageUserOption => Boolean(item))
        );
      } catch (error) {
        reportError(error);
      }
    }

    if (
      categories.length > 0 ||
      counties.length > 0 ||
      cities.length > 0 ||
      users.length > 0
    ) {
      loadAvailableFilterOptions();
    } else {
      setAvailableCategories([]);
      setAvailableCounties([]);
      setAvailableCities([]);
      setAvailableStatuses([]);
      setAvailableConditions([]);
      setAvailableUsers([]);
    }

    return () => {
      isCancelled = true;
    };
  }, [appliedFilters, categories, counties, cities, users]);

  function updateFilter<K extends keyof ManageVehicleFilterState>(
    key: K,
    value: ManageVehicleFilterState[K]
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));

    if (key !== "regNumber") {
      setPage(1);
    }
  }

  function handleResetFilters() {
    setFilters(initialFilters);
    setDebouncedRegNumber("");
    setSelectedVehicleId(null);
    setPage(1);
  }

  async function handleOpenUpdateVehicleModal(vehicle: ManageVehicle) {
    if (vehicle.status === "Kinnitatud") {
      showToast({
        variant: "error",
        title: "Muutmine pole lubatud",
        message: "Kinnitatud sõidukit ei saa muuta.",
      });

      return;
    }

    try {
      setIsEditLoading(true);

      const detailedVehicle = await getManageVehicleById(vehicle.vehicle_id);

      setVehicleToEdit(detailedVehicle);
      setIsUpdateVehicleOpen(true);
    } catch (error) {
      reportError(error);

      showToast({
        variant: "error",
        title: "Sõiduki laadimine ebaõnnestus",
        message: "Sõiduki muutmise vormi jaoks ei õnnestunud andmeid laadida.",
      });
    } finally {
      setIsEditLoading(false);
    }
  }

  function handleCloseUpdateVehicleModal() {
    setIsUpdateVehicleOpen(false);
    setVehicleToEdit(null);
  }

  function handleVehicleUpdated() {
    setIsUpdateVehicleOpen(false);
    setVehicleToEdit(null);

    loadVehicles();
    loadStats();
    loadReferenceData();
  }

  function handleOpenDeleteVehicleModal(vehicle: ManageVehicle) {
    if (vehicle.status === "Kinnitatud") {
      showToast({
        variant: "error",
        title: "Kustutamine pole lubatud",
        message: "Kinnitatud sõidukit ei saa kustutada.",
      });

      return;
    }

    setVehicleToDelete(vehicle);
    setIsDeleteModalOpen(true);
  }

  function handleCloseDeleteVehicleModal() {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
    setVehicleToDelete(null);
  }

  async function handleConfirmDeleteVehicle() {
    if (!vehicleToDelete) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteManageVehicle(vehicleToDelete.vehicle_id);

      showToast({
        variant: "success",
        title: "Sõiduk kustutatud",
        message: `Sõiduk ${vehicleToDelete.reg_number} ja seotud fotod kustutati.`,
      });

      setSelectedVehicleId(null);
      setIsDeleteModalOpen(false);
      setVehicleToDelete(null);

      loadStats();
      loadReferenceData();

      if (vehicles.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadVehicles();
      }
    } catch (error) {
      reportError(error);

      showToast({
        variant: "error",
        title: "Kustutamine ebaõnnestus",
        message: "Sõidukit ei õnnestunud kustutada.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function handleOpenApproveModal(vehicle: ManageVehicle) {
    setVehicleToApprove(vehicle);
  }

  function handleCloseApproveModal() {
    if (isApproving) {
      return;
    }

    setVehicleToApprove(null);
  }

  async function handleConfirmApproveVehicle() {
    if (!vehicleToApprove) {
      return;
    }

    try {
      setIsApproving(true);

      await approveManageVehicle(vehicleToApprove.vehicle_id);

      showToast({
        variant: "success",
        title: "Sõiduk kinnitatud",
        message: `Sõiduk ${vehicleToApprove.reg_number} kinnitati.`,
      });

      setVehicleToApprove(null);

      loadVehicles();
      loadStats();
      loadReferenceData();
    } catch (error) {
      reportError(error);

      showToast({
        variant: "error",
        title: "Kinnitamine ebaõnnestus",
        message: "Sõidukit ei õnnestunud kinnitada.",
      });
    } finally {
      setIsApproving(false);
    }
  }

  function handleOpenRejectModal(vehicle: ManageVehicle) {
    setRejectComment("");
    setVehicleToReject(vehicle);
  }

  function handleCloseRejectModal() {
    if (isRejecting) {
      return;
    }

    setVehicleToReject(null);
    setRejectComment("");
  }

  async function handleConfirmRejectVehicle() {
    if (!vehicleToReject || !rejectComment.trim()) {
      return;
    }

    try {
      setIsRejecting(true);

      await rejectManageVehicle(vehicleToReject.vehicle_id, {
        review_comment: rejectComment.trim(),
      });

      showToast({
        variant: "success",
        title: "Sõiduk tagasi lükatud",
        message: `Sõiduk ${vehicleToReject.reg_number} lükati tagasi.`,
      });

      setVehicleToReject(null);
      setRejectComment("");

      loadVehicles();
      loadStats();
      loadReferenceData();
    } catch (error) {
      reportError(error);

      showToast({
        variant: "error",
        title: "Tagasilükkamine ebaõnnestus",
        message: "Sõidukit ei õnnestunud tagasi lükata.",
      });
    } finally {
      setIsRejecting(false);
    }
  }

  function handleOpenPendingModal(vehicle: ManageVehicle) {
    setVehicleToPending(vehicle);
  }

  function handleClosePendingModal() {
    if (isPending) {
      return;
    }

    setVehicleToPending(null);
  }

  async function handleConfirmPendingVehicle() {
    if (!vehicleToPending) {
      return;
    }

    try {
      setIsPending(true);
      await pendingManageVehicle(vehicleToPending.vehicle_id);

      showToast({
        variant: "success",
        title: "Sõiduk pandi ootele",
        message: `Sõiduk ${vehicleToPending.reg_number} pandi tagasi ootele.`,
      });

      setVehicleToPending(null);

      loadVehicles();
      loadStats();
      loadReferenceData();
    } catch (error) {
      reportError(error);

      showToast({
        variant: "error",
        title: "Staatuse muutmine ebaõnnestus",
        message: "Sõidukit ei õnnestunud tagasi ootele panna.",
      });
    } finally {
      setIsPending(false);
    }
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return;
    }

    setPage(nextPage);
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Manage"
        title="Sõidukite haldus"
        description="Siin näed kõiki lisatud sõidukeid ja saad neid modereerida."
      />

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
            Statistika
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
            Sõidukite ülevaade
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Siin kuvatakse kõikide sõidukikaartide modereerimise seis.
          </p>
        </div>

        {isStatsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-3xl bg-slate-100"
              />
            ))}
          </div>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              label="Sõidukid kokku"
              value={stats.total}
              icon={<BarChart3 size={24} />}
            />

            <DashboardStatCard
              label="Ootel"
              value={stats.pending}
              icon={<Clock3 size={24} />}
            />

            <DashboardStatCard
              label="Kinnitatud"
              value={stats.confirmed}
              icon={<CheckCircle2 size={24} />}
            />

            <DashboardStatCard
              label="Tagasi lükatud"
              value={stats.rejected}
              icon={<XCircle size={24} />}
            />
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-500">
            Statistikat ei õnnestunud laadida.
          </p>
        )}
      </section>

      <DashboardFiltersPanel
        title="Sõidukite nimekiri"
        description="Filtreeri sõidukeid registrinumbri, kategooria, asukoha, staatuse, seisukorra, kasutaja ja lisamise kuupäeva järgi."
        activeFiltersCount={activeFiltersCount}
        isOpen={isFiltersOpen}
        onToggle={() => setIsFiltersOpen((current) => !current)}
        onReset={handleResetFilters}
      >
        <ManageVehiclesFilters
          filters={filters}
          categories={availableCategories}
          counties={availableCounties}
          cities={availableCities}
          statuses={availableStatuses}
          conditions={availableConditions}
          users={availableUsers}
          onChange={updateFilter}
        />
      </DashboardFiltersPanel>

      <div className="flex justify-end">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
          <span>
            Leitud sõidukeid:{" "}
            <span className="font-extrabold text-slate-950">
              {vehicles.length}
            </span>
          </span>

          <span className="text-slate-300">/</span>

          <span>
            Kokku:{" "}
            <span className="font-extrabold text-slate-950">
              {allVehiclesTotal}
            </span>
          </span>
        </div>
      </div>

      <section className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-3xl bg-white ring-1 ring-slate-200"
            />
          ))
        ) : vehicles.length > 0 ? (
          vehicles.map((vehicle, index) => (
            <ManageVehicleCard
              key={vehicle.vehicle_id}
              vehicle={vehicle}
              index={index}
              onAddPhoto={setSelectedVehicleId}
              onEdit={handleOpenUpdateVehicleModal}
              onDelete={handleOpenDeleteVehicleModal}
              onApprove={handleOpenApproveModal}
              onReject={handleOpenRejectModal}
              onPending={handleOpenPendingModal}
            />
          ))
        ) : (
          <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-bold text-slate-900">
              Sõidukeid ei leitud
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Muuda filtreid või kontrolli olemasolevaid andmeid.
            </p>
          </div>
        )}

        {isEditLoading && (
          <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Laadin muutmise vormi...
          </p>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Eelmine
            </button>

            <span className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Järgmine
            </button>
          </div>
        )}
      </section>

      <UpdateVehicleModal
        isOpen={isUpdateVehicleOpen}
        vehicle={vehicleToEdit}
        onClose={handleCloseUpdateVehicleModal}
        onSuccess={handleVehicleUpdated}
        onUpdateVehicle={(vehicleId, data) =>
          updateManageVehicle(
            vehicleId,
            data as Parameters<typeof updateManageVehicle>[1]
          )
        }
        onUpdateFirstPhoto={(photoId, data) =>
          updateManagePhoto(
            photoId,
            data as Parameters<typeof updateManagePhoto>[1]
          )
        }
      />

      {selectedVehicle && (
        <AddPhotoModal
          isOpen={Boolean(selectedVehicle)}
          vehicleId={selectedVehicle.vehicle_id}
          cities={formCities}
          onClose={() => setSelectedVehicleId(null)}
          onSuccess={() => {
            setSelectedVehicleId(null);
            loadVehicles();
            loadStats();
            loadReferenceData();
          }}
        />
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Kustuta sõiduk"
        message={
          vehicleToDelete
            ? `Kas oled kindel, et soovid kustutada sõiduki ${vehicleToDelete.reg_number}? Koos sõidukiga kustutatakse ka kõik selle sõidukiga seotud fotod.`
            : "Kas oled kindel, et soovid selle sõiduki kustutada?"
        }
        confirmLabel="Kustuta sõiduk"
        isLoading={isDeleting}
        onClose={handleCloseDeleteVehicleModal}
        onConfirm={handleConfirmDeleteVehicle}
      />

      <ApproveConfirmModal
        isOpen={Boolean(vehicleToApprove)}
        title="Kinnita sõiduk"
        message={
          vehicleToApprove
            ? `Kas oled kindel, et soovid kinnitada sõiduki ${vehicleToApprove.reg_number}? Pärast kinnitamist kuvatakse see avalikus vaates.`
            : "Kas oled kindel, et soovid selle sõiduki kinnitada?"
        }
        confirmLabel="Kinnita sõiduk"
        isLoading={isApproving}
        onClose={handleCloseApproveModal}
        onConfirm={handleConfirmApproveVehicle}
      />

      <PendingConfirmModal
        isOpen={Boolean(vehicleToPending)}
        title="Pane sõiduk ootele"
        message={
          vehicleToPending
            ? `Kas oled kindel, et soovid sõiduki ${vehicleToPending.reg_number} tagasi ootele panna?`
            : "Kas oled kindel, et soovid selle sõiduki tagasi ootele panna?"
        }
        confirmLabel="Pane ootele"
        isLoading={isPending}
        onClose={handleClosePendingModal}
        onConfirm={handleConfirmPendingVehicle}
      />

      <RejectReasonModal
        isOpen={Boolean(vehicleToReject)}
        title="Lükka sõiduk tagasi"
        message={
          vehicleToReject
            ? `Sõiduk ${vehicleToReject.reg_number} lükatakse tagasi. Lisa kasutajale põhjus.`
            : "Lisa põhjus, miks sõiduk tagasi lükatakse."
        }
        comment={rejectComment}
        confirmLabel="Lükka sõiduk tagasi"
        isLoading={isRejecting}
        onCommentChange={setRejectComment}
        onClose={handleCloseRejectModal}
        onConfirm={handleConfirmRejectVehicle}
      />
    </div>
  );
}

export default ManageVehiclesPage;
