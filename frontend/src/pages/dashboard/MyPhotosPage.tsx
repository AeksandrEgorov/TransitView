// This page lists photos added by the logged-in user.
// It handles personal photo filters, preview, edit/delete actions, and pagination.

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Images,
  XCircle,
} from "lucide-react";

import DashboardPageHeader from "../../components/dashboard/DashboardPageHeader";
import DashboardStatCard from "../../components/dashboard/DashboardStatCard";
import DashboardFiltersPanel from "../../components/dashboard/DashboardFiltersPanel";
import MyPhotosFilters, {
  type MyPhotoFilterState,
} from "../../components/dashboard/my-photos/MyPhotosFilters";
import MyPhotoCard from "../../components/dashboard/my-photos/MyPhotoCard";
import PhotoPreviewModal from "../../components/modals/photos/PhotoPreviewModal";
import UpdatePhotoModal from "../../components/modals/photos/UpdatePhotoModal";
import DeleteConfirmModal from "../../components/modals/confirm/DeleteConfirmModal";

import { deleteMyPhoto, getMyPhotos } from "../../config/dashboardApi";
import { getCities, getMyFilters } from "../../config/referenceApi";
import { getMyStats } from "../../config/statsApi";

import { useToast } from "../../hooks/useToast";
import { reportError } from "../../utils/logger";
import type { CategoryItem, CityItem, CountyItem } from "../../types/reference";
import type { DashboardPhoto } from "../../types/dashboard";
import type { MyStats } from "../../config/statsApi";
import type { ReviewStatus, VehicleCondition } from "../../types/vehicle";

const initialFilters: MyPhotoFilterState = {
  status: "",
  regNumber: "",
  categoryId: null,
  countyId: null,
  cityId: null,
  condition: "",
  createdFrom: "",
  createdTo: "",
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

function buildPhotoParams(filters: MyPhotoFilterState) {
  return {
    status: filters.status || undefined,
    regNumber: filters.regNumber.trim() || undefined,
    categoryId: filters.categoryId ?? undefined,
    countyId: filters.countyId ?? undefined,
    cityId: filters.cityId ?? undefined,
    condition: filters.condition || undefined,
    createdFrom: filters.createdFrom || undefined,
    createdTo: filters.createdTo || undefined,
  };
}

async function optionHasResults(filters: MyPhotoFilterState) {
  const data = await getMyPhotos({
    page: 1,
    limit: 1,
    ...buildPhotoParams(filters),
  });

  return data.meta.total > 0;
}

function MyPhotosPage() {
  const { showToast } = useToast();

  const [photos, setPhotos] = useState<DashboardPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<DashboardPhoto | null>(
    null
  );

  const [photoToEdit, setPhotoToEdit] = useState<DashboardPhoto | null>(null);
  const [isUpdatePhotoOpen, setIsUpdatePhotoOpen] = useState(false);

  const [photoToDelete, setPhotoToDelete] = useState<DashboardPhoto | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [counties, setCounties] = useState<CountyItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [formCities, setFormCities] = useState<CityItem[]>([]);

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

  const [myStats, setMyStats] = useState<MyStats | null>(null);

  const [filters, setFilters] = useState<MyPhotoFilterState>(initialFilters);
  const [debouncedRegNumber, setDebouncedRegNumber] = useState("");

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const limit = 10;

  const appliedFilters = useMemo<MyPhotoFilterState>(
    () => ({
      status: filters.status,
      regNumber: debouncedRegNumber,
      categoryId: filters.categoryId,
      countyId: filters.countyId,
      cityId: filters.cityId,
      condition: filters.condition,
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
    }),
    [
      filters.status,
      filters.categoryId,
      filters.countyId,
      filters.cityId,
      filters.condition,
      filters.createdFrom,
      filters.createdTo,
      debouncedRegNumber,
    ]
  );

  const allPhotosTotal = myStats?.photos.total ?? totalPhotos;

  const selectedPhotoIndex = selectedPhoto
    ? photos.findIndex((photo) => photo.photo_id === selectedPhoto.photo_id)
    : -1;

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length;
  }, [filters]);

  async function loadPhotos() {
    try {
      setIsLoading(true);

      const data = await getMyPhotos({
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
      reportError(error);

      showToast({
        variant: "error",
        title: "Fotode laadimine ebaõnnestus",
        message: "Enda fotosid ei õnnestunud laadida.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStats() {
    try {
      setIsStatsLoading(true);

      const data = await getMyStats();
      setMyStats(data);
    } catch (error) {
      reportError(error);

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
      const [filtersData, citiesData] = await Promise.all([
        getMyFilters(),
        getCities(),
      ]);

      setCategories(filtersData.photoFilters.categories);
      setCounties(filtersData.photoFilters.counties);
      setCities(filtersData.photoFilters.cities);
      setFormCities(citiesData);
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
      } catch (error) {
        reportError(error);
      }
    }

    if (categories.length > 0 || counties.length > 0 || cities.length > 0) {
      loadAvailableFilterOptions();
    } else {
      setAvailableCategories([]);
      setAvailableCounties([]);
      setAvailableCities([]);
      setAvailableStatuses([]);
      setAvailableConditions([]);
    }

    return () => {
      isCancelled = true;
    };
  }, [appliedFilters, categories, counties, cities]);

  useEffect(() => {
    setPage(1);
    setSelectedPhoto(null);
  }, [appliedFilters]);

  function updateFilter<K extends keyof MyPhotoFilterState>(
    key: K,
    value: MyPhotoFilterState[K]
  ) {
    setPage(1);

    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleResetFilters() {
    setFilters(initialFilters);
    setDebouncedRegNumber("");
    setSelectedPhoto(null);
    setPage(1);
  }

  function handleOpenUpdatePhotoModal(photo: DashboardPhoto) {
    if (photo.status === "Kinnitatud") {
      showToast({
        variant: "error",
        title: "Muutmine pole lubatud",
        message: "Kinnitatud fotot ei saa muuta.",
      });

      return;
    }

    setPhotoToEdit(photo);
    setIsUpdatePhotoOpen(true);
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

  function handleOpenDeletePhotoModal(photo: DashboardPhoto) {
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

      await deleteMyPhoto(photoToDelete.photo_id);

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
      reportError(error);

      showToast({
        variant: "error",
        title: "Kustutamine ebaõnnestus",
        message: "Fotot ei õnnestunud kustutada.",
      });
    } finally {
      setIsDeleting(false);
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
        eyebrow="Minu ala"
        title="Minu fotod"
        description="Siin näed enda lisatud fotosid ja nende modereerimise staatust."
      />

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
            Statistika
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
            Minu fotode ülevaade
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Siin kuvatakse sinu fotode modereerimise seis.
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
        ) : myStats ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              label="Fotod kokku"
              value={myStats.photos.total}
              icon={<Images size={24} />}
            />

            <DashboardStatCard
              label="Ootel"
              value={myStats.photos.pending}
              icon={<Clock3 size={24} />}
            />

            <DashboardStatCard
              label="Kinnitatud"
              value={myStats.photos.confirmed}
              icon={<CheckCircle2 size={24} />}
            />

            <DashboardStatCard
              label="Tagasi lükatud"
              value={myStats.photos.rejected}
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
        description="Filtreeri enda lisatud fotosid registrinumbri, kategooria, asukoha, staatuse, seisukorra ja lisamise kuupäeva järgi."
        activeFiltersCount={activeFiltersCount}
        isOpen={isFiltersOpen}
        onToggle={() => setIsFiltersOpen((current) => !current)}
        onReset={handleResetFilters}
      >
        <MyPhotosFilters
          filters={filters}
          categories={availableCategories}
          counties={availableCounties}
          cities={availableCities}
          statuses={availableStatuses}
          conditions={availableConditions}
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
            <MyPhotoCard
              key={photo.photo_id}
              photo={photo}
              index={index}
              onPreview={setSelectedPhoto}
              onEdit={handleOpenUpdatePhotoModal}
              onDelete={handleOpenDeletePhotoModal}
            />
          ))
        ) : (
          <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-bold text-slate-900">
              Fotosid ei leitud
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Muuda filtrit või lisa foto sõiduki detailvaatest.
            </p>
          </div>
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
            ? `/dashboard/vehicles/${selectedPhoto.vehicle_id}`
            : undefined
        }
      />

      <UpdatePhotoModal
        isOpen={isUpdatePhotoOpen}
        photo={photoToEdit}
        cities={formCities}
        onClose={handleCloseUpdatePhotoModal}
        onSuccess={handlePhotoUpdated}
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
    </div>
  );
}

export default MyPhotosPage;
