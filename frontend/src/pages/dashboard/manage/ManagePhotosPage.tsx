import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  ImageIcon,
  Images,
  Pencil,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import DashboardPageHeader from "../../../components/dashboard/DashboardPageHeader";
import ReviewStatusBadge from "../../../components/dashboard/ReviewStatusBadge";
import DashboardStatCard from "../../../components/dashboard/DashboardStatCard";
import DashboardFiltersPanel from "../../../components/dashboard/DashboardFiltersPanel";
import ManagePhotosFilters, {
  type ManagePhotoFilterState,
} from "../../../components/dashboard/ManagePhotosFilters";

import PhotoPreviewModal from "../../../components/modals/PhotoPreviewModal";
import UpdatePhotoModal from "../../../components/modals/UpdatePhotoModal";
import DeleteConfirmModal from "../../../components/modals/DeleteConfirmModal";
import ApproveConfirmModal from "../../../components/modals/ApproveConfirmModal";
import RejectReasonModal from "../../../components/modals/RejectReasonModal";
import PendingConfirmModal from "../../../components/modals/PendingConfirmModal";

import {
  approveManagePhoto,
  deleteManagePhoto,
  getManagePhotoById,
  getManagePhotos,
  getManageUsers,
  pendingManagePhoto,
  rejectManagePhoto,
  updateManagePhoto,
  type ManagePhoto,
  type ManageUserOption,
} from "../../../config/manageApi";
import {
  getCategories,
  getCities,
  getCounties,
} from "../../../config/referenceApi";

import { useToast } from "../../../hooks/useToast";
import { getCloudinaryImageUrl } from "../../../utils/cloudinary";
import { formatVehicleCondition } from "../../../utils/formatters";

import type {
  CategoryItem,
  CityItem,
  CountyItem,
} from "../../../types/reference";
import type { ReviewStatus, VehicleCondition } from "../../../types/vehicle";

interface ManagePhotoStats {
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
}

const initialFilters: ManagePhotoFilterState = {
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

function formatDate(value?: string | null) {
  if (!value) {
    return "Teadmata";
  }

  return new Date(value).toLocaleDateString("et-EE");
}

function buildPhotoParams(filters: ManagePhotoFilterState) {
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
    userId,
  };
}

function getConditionBadgeClass(condition: VehicleCondition) {
  if (condition === "Töökorras") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (condition === "Ei_tööta") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (condition === "Maha_kantud") {
    return "bg-slate-100 text-slate-700 ring-slate-200";
  }

  if (condition === "Müüdud") {
    return "bg-violet-50 text-violet-700 ring-violet-100";
  }

  return "bg-white/90 text-slate-700 ring-slate-200";
}

function getPhotoUserLabel(photo: ManagePhoto) {
  const extendedPhoto = photo as ManagePhoto & {
    author?: {
      user_id?: number;
      username?: string | null;
      email?: string | null;
    } | null;
  };

  if (!extendedPhoto.author) {
    return "Kasutaja teadmata";
  }

  const username = extendedPhoto.author.username || "Nimetu kasutaja";
  const email = extendedPhoto.author.email
    ? ` · ${extendedPhoto.author.email}`
    : "";

  return `${username}${email}`;
}

async function optionHasResults(filters: ManagePhotoFilterState) {
  const data = await getManagePhotos({
    page: 1,
    limit: 1,
    ...buildPhotoParams(filters),
  });

  return data.meta.total > 0;
}

interface ManagePhotoCardProps {
  photo: ManagePhoto;
  index: number;
  onPreview: (photo: ManagePhoto) => void;
  onEdit: (photo: ManagePhoto) => void;
  onDelete: (photo: ManagePhoto) => void;
  onApprove: (photo: ManagePhoto) => void;
  onReject: (photo: ManagePhoto) => void;
  onPending: (photo: ManagePhoto) => void;
}

function ManagePhotoCard({
  photo,
  index,
  onPreview,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onPending,
}: ManagePhotoCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  const canModify = photo.status !== "Kinnitatud";
  const canApprove = photo.status !== "Kinnitatud";
  const canPending = photo.status !== "Ootel";
  const canReject = photo.status !== "Tagasi_lukatud";
  const hasManageActions = canModify || canApprove || canPending || canReject;
  const canOpenPublicVehicle = photo.vehicle.status === "Kinnitatud";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, Math.min(index, 8) * 45);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [index, photo.photo_id]);

  return (
    <article
      className={`overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
        <button
          type="button"
          onClick={() => onPreview(photo)}
          className="group relative min-h-44 overflow-hidden bg-slate-200 text-left lg:min-h-full"
        >
          {photo.file_path ? (
            <img
              src={getCloudinaryImageUrl(
                photo.file_path,
                "w_500,h_360,c_fill,q_auto,f_auto"
              )}
              alt={photo.vehicle.reg_number}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full min-h-44 items-center justify-center text-slate-400">
              <Camera size={32} />
            </div>
          )}

          <span
            className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-extrabold shadow-sm ring-1 ${getConditionBadgeClass(
              photo.vehicle.condition
            )}`}
          >
            {formatVehicleCondition(photo.vehicle.condition)}
          </span>

          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition group-hover:bg-slate-950/35 group-hover:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-lg">
              <ImageIcon size={16} />
              Vaata fotot
            </span>
          </div>
        </button>

        <div className="p-5">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-extrabold text-slate-950">
                  {photo.vehicle.reg_number}
                </h3>

                <ReviewStatusBadge status={photo.status} />
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-600">
                {photo.vehicle.model.manufacturer} {photo.vehicle.model.name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {photo.vehicle.model.category.name} · Lisatud{" "}
                {formatDate(photo.created_at)}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {photo.city
                  ? `${photo.city.name}, ${photo.city.county.name}`
                  : "Linn puudub / väljaspool linna"}
                {photo.place ? ` · ${photo.place}` : ""}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Kasutaja: {getPhotoUserLabel(photo)}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 2xl:w-auto 2xl:min-w-[520px]">
              <div className="flex flex-wrap gap-2 2xl:justify-end">
                <button
                  type="button"
                  onClick={() => onPreview(photo)}
                  className="inline-flex min-w-[125px] flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 2xl:flex-none"
                >
                  <ImageIcon size={16} />
                  Vaata fotot
                </button>

                <Link
                  to={`/dashboard/manage/vehicles/${photo.vehicle_id}`}
                  className="inline-flex min-w-[135px] flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 2xl:flex-none"
                >
                  <Eye size={16} />
                  Vaata sõidukit
                </Link>

                {canOpenPublicVehicle && (
                  <Link
                    to={`/vehicles/${photo.vehicle_id}`}
                    className="inline-flex min-w-[135px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 2xl:flex-none"
                  >
                    <ShieldCheck size={16} />
                    Avalik vaade
                  </Link>
                )}
              </div>

              {hasManageActions && (
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 2xl:justify-end">
                  {canModify && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(photo)}
                        className="inline-flex min-w-[105px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200 2xl:flex-none"
                      >
                        <Pencil size={16} />
                        Muuda
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(photo)}
                        className="inline-flex min-w-[105px] flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100 2xl:flex-none"
                      >
                        <Trash2 size={16} />
                        Kustuta
                      </button>
                    </>
                  )}

                  {canApprove && (
                    <button
                      type="button"
                      onClick={() => onApprove(photo)}
                      className="inline-flex min-w-[110px] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 2xl:flex-none"
                    >
                      <CheckCircle2 size={16} />
                      Kinnita
                    </button>
                  )}

                  {canPending && (
                    <button
                      type="button"
                      onClick={() => onPending(photo)}
                      className="inline-flex min-w-[125px] flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-100 2xl:flex-none"
                    >
                      <Clock3 size={16} />
                      Pane ootele
                    </button>
                  )}

                  {canReject && (
                    <button
                      type="button"
                      onClick={() => onReject(photo)}
                      className="inline-flex min-w-[145px] flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 transition hover:bg-orange-100 2xl:flex-none"
                    >
                      <XCircle size={16} />
                      Lükka tagasi
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {photo.review_comment && (
            <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
              <span className="font-bold">Kommentaar: </span>
              {photo.review_comment}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ManagePhotosPage() {
  const { showToast } = useToast();

  const [photos, setPhotos] = useState<ManagePhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<ManagePhoto | null>(null);

  const [photoToEdit, setPhotoToEdit] = useState<ManagePhoto | null>(null);
  const [isUpdatePhotoOpen, setIsUpdatePhotoOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const [photoToDelete, setPhotoToDelete] = useState<ManagePhoto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [photoToApprove, setPhotoToApprove] = useState<ManagePhoto | null>(
    null
  );
  const [isApproving, setIsApproving] = useState(false);

  const [photoToReject, setPhotoToReject] = useState<ManagePhoto | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const [photoToPending, setPhotoToPending] = useState<ManagePhoto | null>(
    null
  );
  const [isPending, setIsPending] = useState(false);

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

  const [stats, setStats] = useState<ManagePhotoStats | null>(null);

  const [filters, setFilters] =
    useState<ManagePhotoFilterState>(initialFilters);
  const [debouncedRegNumber, setDebouncedRegNumber] = useState("");

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const limit = 10;

  const appliedFilters = useMemo<ManagePhotoFilterState>(
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

  const allPhotosTotal = stats?.total ?? totalPhotos;

  const selectedPhotoIndex = selectedPhoto
    ? photos.findIndex((photo) => photo.photo_id === selectedPhoto.photo_id)
    : -1;

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length;
  }, [filters]);

  async function loadPhotos() {
    try {
      setIsLoading(true);

      const data = await getManagePhotos({
        page,
        limit,
        ...buildPhotoParams(appliedFilters),
      });

      setPhotos(data.items);
      setTotalPages(Math.max(data.meta.totalPages, 1));
      setTotalPhotos(data.meta.total);

      setSelectedPhoto((currentPhoto) => {
        if (!currentPhoto) {
          return null;
        }

        const stillExists = data.items.find(
          (photo) => photo.photo_id === currentPhoto.photo_id
        );

        return stillExists ?? null;
      });
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Fotode laadimine ebaõnnestus",
        message: "Fotode nimekirja ei õnnestunud laadida.",
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
          getManagePhotos({ page: 1, limit: 1 }),
          getManagePhotos({ page: 1, limit: 1, status: "Ootel" }),
          getManagePhotos({ page: 1, limit: 1, status: "Kinnitatud" }),
          getManagePhotos({ page: 1, limit: 1, status: "Tagasi_lukatud" }),
        ]);

      setStats({
        total: allData.meta.total,
        pending: pendingData.meta.total,
        confirmed: confirmedData.meta.total,
        rejected: rejectedData.meta.total,
      });
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Statistika laadimine ebaõnnestus",
        message: "Fotode statistikat ei õnnestunud laadida.",
      });
    } finally {
      setIsStatsLoading(false);
    }
  }

  async function loadReferenceData() {
    try {
      const [categoriesData, countiesData, citiesData, usersData] =
        await Promise.all([
          getCategories(),
          getCounties(),
          getCities(),
          getManageUsers({ page: 1, limit: 100 }),
        ]);

      setCategories(categoriesData);
      setCounties(countiesData);
      setCities(citiesData);
      setFormCities(citiesData);
      setUsers(usersData.items);

      setAvailableCategories(categoriesData);
      setAvailableCounties(countiesData);
      setAvailableCities(citiesData);
      setAvailableStatuses(statusOrder);
      setAvailableConditions(conditionOrder);
      setAvailableUsers(usersData.items);
    } catch (error) {
      console.error(error);

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
    loadPhotos();
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
        console.error(error);
      }
    }

    if (
      categories.length > 0 ||
      counties.length > 0 ||
      cities.length > 0 ||
      users.length > 0
    ) {
      loadAvailableFilterOptions();
    }

    return () => {
      isCancelled = true;
    };
  }, [appliedFilters, categories, counties, cities, users]);

  function updateFilter<K extends keyof ManagePhotoFilterState>(
    key: K,
    value: ManagePhotoFilterState[K]
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));

    if (key !== "regNumber") {
      setPage(1);
      setSelectedPhoto(null);
    }
  }

  function handleResetFilters() {
    setFilters(initialFilters);
    setDebouncedRegNumber("");
    setSelectedPhoto(null);
    setPage(1);
  }

  async function handleOpenUpdatePhotoModal(photo: ManagePhoto) {
    if (photo.status === "Kinnitatud") {
      showToast({
        variant: "error",
        title: "Muutmine pole lubatud",
        message: "Kinnitatud fotot ei saa muuta.",
      });

      return;
    }

    try {
      setIsEditLoading(true);

      const detailedPhoto = await getManagePhotoById(photo.photo_id);

      setPhotoToEdit(detailedPhoto);
      setIsUpdatePhotoOpen(true);
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Foto laadimine ebaõnnestus",
        message: "Foto muutmise vormi jaoks ei õnnestunud andmeid laadida.",
      });
    } finally {
      setIsEditLoading(false);
    }
  }

  function handleCloseUpdatePhotoModal() {
    setIsUpdatePhotoOpen(false);
    setPhotoToEdit(null);
  }

  function handlePhotoUpdated() {
    setIsUpdatePhotoOpen(false);
    setPhotoToEdit(null);
    setSelectedPhoto(null);

    loadPhotos();
    loadStats();
    loadReferenceData();
  }

  function handleOpenDeletePhotoModal(photo: ManagePhoto) {
    if (photo.status === "Kinnitatud") {
      showToast({
        variant: "error",
        title: "Kustutamine pole lubatud",
        message: "Kinnitatud fotot ei saa kustutada.",
      });

      return;
    }

    setPhotoToDelete(photo);
    setIsDeleteModalOpen(true);
  }

  function handleCloseDeletePhotoModal() {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
    setPhotoToDelete(null);
  }

  async function handleConfirmDeletePhoto() {
    if (!photoToDelete) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteManagePhoto(photoToDelete.photo_id);

      showToast({
        variant: "success",
        title: "Foto kustutatud",
        message: `Foto #${photoToDelete.photo_id} eemaldati edukalt.`,
      });

      if (selectedPhoto?.photo_id === photoToDelete.photo_id) {
        setSelectedPhoto(null);
      }

      setIsDeleteModalOpen(false);
      setPhotoToDelete(null);

      loadStats();
      loadReferenceData();

      if (photos.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadPhotos();
      }
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Kustutamine ebaõnnestus",
        message: "Fotot ei õnnestunud kustutada.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function handleOpenApproveModal(photo: ManagePhoto) {
    setPhotoToApprove(photo);
  }

  function handleCloseApproveModal() {
    if (isApproving) {
      return;
    }

    setPhotoToApprove(null);
  }

  async function handleConfirmApprovePhoto() {
    if (!photoToApprove) {
      return;
    }

    try {
      setIsApproving(true);

      await approveManagePhoto(photoToApprove.photo_id);

      showToast({
        variant: "success",
        title: "Foto kinnitatud",
        message: `Foto #${photoToApprove.photo_id} kinnitati.`,
      });

      setPhotoToApprove(null);

      loadPhotos();
      loadStats();
      loadReferenceData();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Kinnitamine ebaõnnestus",
        message: "Fotot ei õnnestunud kinnitada.",
      });
    } finally {
      setIsApproving(false);
    }
  }

  function handleOpenRejectModal(photo: ManagePhoto) {
    setRejectComment("");
    setPhotoToReject(photo);
  }

  function handleCloseRejectModal() {
    if (isRejecting) {
      return;
    }

    setPhotoToReject(null);
    setRejectComment("");
  }

  async function handleConfirmRejectPhoto() {
    if (!photoToReject || !rejectComment.trim()) {
      return;
    }

    try {
      setIsRejecting(true);

      await rejectManagePhoto(photoToReject.photo_id, {
        review_comment: rejectComment.trim(),
      });

      showToast({
        variant: "success",
        title: "Foto tagasi lükatud",
        message: `Foto #${photoToReject.photo_id} lükati tagasi.`,
      });

      setPhotoToReject(null);
      setRejectComment("");

      loadPhotos();
      loadStats();
      loadReferenceData();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Tagasilükkamine ebaõnnestus",
        message: "Fotot ei õnnestunud tagasi lükata.",
      });
    } finally {
      setIsRejecting(false);
    }
  }

  function handleOpenPendingModal(photo: ManagePhoto) {
    setPhotoToPending(photo);
  }

  function handleClosePendingModal() {
    if (isPending) {
      return;
    }

    setPhotoToPending(null);
  }

  async function handleConfirmPendingPhoto() {
    if (!photoToPending) {
      return;
    }

    try {
      setIsPending(true);

      await pendingManagePhoto(photoToPending.photo_id);

      showToast({
        variant: "success",
        title: "Foto pandi ootele",
        message: `Foto #${photoToPending.photo_id} pandi tagasi ootele.`,
      });

      setPhotoToPending(null);

      loadPhotos();
      loadStats();
      loadReferenceData();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Staatuse muutmine ebaõnnestus",
        message: "Fotot ei õnnestunud tagasi ootele panna.",
      });
    } finally {
      setIsPending(false);
    }
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return;
    }

    setSelectedPhoto(null);
    setPage(nextPage);
  }

  function handlePreviousPhoto() {
    if (!selectedPhoto || photos.length <= 1) {
      return;
    }

    const currentIndex = photos.findIndex(
      (photo) => photo.photo_id === selectedPhoto.photo_id
    );

    const previousIndex =
      currentIndex <= 0 ? photos.length - 1 : currentIndex - 1;

    const previousPhoto = photos[previousIndex];

    if (previousPhoto) {
      setSelectedPhoto(previousPhoto);
    }
  }

  function handleNextPhoto() {
    if (!selectedPhoto || photos.length <= 1) {
      return;
    }

    const currentIndex = photos.findIndex(
      (photo) => photo.photo_id === selectedPhoto.photo_id
    );

    const nextIndex =
      currentIndex >= photos.length - 1 ? 0 : currentIndex + 1;

    const nextPhoto = photos[nextIndex];

    if (nextPhoto) {
      setSelectedPhoto(nextPhoto);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Manage"
        title="Fotode haldus"
        description="Siin näed kõiki lisatud fotosid ja saad neid modereerida."
      />

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
            Statistika
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
            Fotode ülevaade
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Siin kuvatakse kõikide fotode modereerimise seis.
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
              label="Fotod kokku"
              value={stats.total}
              icon={<Images size={24} />}
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
        title="Fotode nimekiri"
        description="Filtreeri fotosid registrinumbri, kategooria, asukoha, staatuse, seisukorra, kasutaja ja lisamise kuupäeva järgi."
        activeFiltersCount={activeFiltersCount}
        isOpen={isFiltersOpen}
        onToggle={() => setIsFiltersOpen((current) => !current)}
        onReset={handleResetFilters}
      >
        <ManagePhotosFilters
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
            Leitud fotosid:{" "}
            <span className="font-extrabold text-slate-950">
              {photos.length}
            </span>
          </span>

          <span className="text-slate-300">/</span>

          <span>
            Kokku:{" "}
            <span className="font-extrabold text-slate-950">
              {allPhotosTotal}
            </span>
          </span>
        </div>
      </div>

      <section className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-3xl bg-white ring-1 ring-slate-200"
            />
          ))
        ) : photos.length > 0 ? (
          photos.map((photo, index) => (
            <ManagePhotoCard
              key={photo.photo_id}
              photo={photo}
              index={index}
              onPreview={setSelectedPhoto}
              onEdit={handleOpenUpdatePhotoModal}
              onDelete={handleOpenDeletePhotoModal}
              onApprove={handleOpenApproveModal}
              onReject={handleOpenRejectModal}
              onPending={handleOpenPendingModal}
            />
          ))
        ) : (
          <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-bold text-slate-900">
              Fotosid ei leitud
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

      <PhotoPreviewModal
        isOpen={Boolean(selectedPhoto)}
        photo={selectedPhoto}
        photos={photos}
        currentIndex={selectedPhotoIndex >= 0 ? selectedPhotoIndex : 0}
        onClose={() => setSelectedPhoto(null)}
        onPrevious={handlePreviousPhoto}
        onNext={handleNextPhoto}
        showVehicleLink={Boolean(selectedPhoto)}
        vehicleLink={
          selectedPhoto
            ? `/dashboard/manage/vehicles/${selectedPhoto.vehicle_id}`
            : undefined
        }
      />

      <UpdatePhotoModal
        isOpen={isUpdatePhotoOpen}
        photo={photoToEdit}
        cities={formCities}
        onClose={handleCloseUpdatePhotoModal}
        onSuccess={handlePhotoUpdated}
        onUpdatePhoto={(photoId, data) =>
          updateManagePhoto(
            photoId,
            data as Parameters<typeof updateManagePhoto>[1]
          )
        }
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Kustuta foto"
        message={
          photoToDelete
            ? `Kas oled kindel, et soovid kustutada foto #${photoToDelete.photo_id}?`
            : "Kas oled kindel, et soovid selle foto kustutada?"
        }
        confirmLabel="Kustuta foto"
        isLoading={isDeleting}
        onClose={handleCloseDeletePhotoModal}
        onConfirm={handleConfirmDeletePhoto}
      />

      <ApproveConfirmModal
        isOpen={Boolean(photoToApprove)}
        title="Kinnita foto"
        message={
          photoToApprove
            ? `Kas oled kindel, et soovid kinnitada foto #${photoToApprove.photo_id}? Pärast kinnitamist saab see avalikus vaates nähtavaks.`
            : "Kas oled kindel, et soovid selle foto kinnitada?"
        }
        confirmLabel="Kinnita foto"
        isLoading={isApproving}
        onClose={handleCloseApproveModal}
        onConfirm={handleConfirmApprovePhoto}
      />

      <PendingConfirmModal
        isOpen={Boolean(photoToPending)}
        title="Pane foto ootele"
        message={
          photoToPending
            ? `Kas oled kindel, et soovid foto #${photoToPending.photo_id} tagasi ootele panna?`
            : "Kas oled kindel, et soovid selle foto tagasi ootele panna?"
        }
        confirmLabel="Pane ootele"
        isLoading={isPending}
        onClose={handleClosePendingModal}
        onConfirm={handleConfirmPendingPhoto}
      />

      <RejectReasonModal
        isOpen={Boolean(photoToReject)}
        title="Lükka foto tagasi"
        message={
          photoToReject
            ? `Foto #${photoToReject.photo_id} lükatakse tagasi. Lisa kasutajale põhjus.`
            : "Lisa põhjus, miks foto tagasi lükatakse."
        }
        comment={rejectComment}
        confirmLabel="Lükka foto tagasi"
        isLoading={isRejecting}
        onCommentChange={setRejectComment}
        onClose={handleCloseRejectModal}
        onConfirm={handleConfirmRejectPhoto}
      />
    </div>
  );
}

export default ManagePhotosPage;